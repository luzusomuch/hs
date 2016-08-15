import Joi from 'joi';
import async from 'async';

module.exports = function(kernel) {
  /**
   * Create new comment
   */
  kernel.app.post('/api/v1/comments', kernel.middleware.isAuthenticated(), (req, res) => {
    var data = {
      objectName: req.body.objectName,
      objectId: req.body.objectId,
      content: req.body.content
    };
    var schema = Joi.object().keys({ 
      objectId: Joi.string().required(),
      objectName: Joi.string().required(),
      content: Joi.string().min(kernel.config.COMMENT_VALIDATORS.minLength).required()
    });
    var result = Joi.validate(data, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    async.parallel([
      (cb) => {
        if (req.body.objectName.toLowerCase()==="comment" && req.body.isSubComment) {
          kernel.model.Comment.findById(req.body.objectId).then(comment => {
            if (!comment) {
              cb({message: 'Comment not found'});
            }
            if (!comment.isSubComment && !comment.blocked) {
              cb(null, {allowCreate: true});
            } else {
              cb(null, {allowCreate: false});
            }
          }).catch(error => {
            cb(error);
          });
        } else {
          cb(null, {allowCreate: true});
        }
      }
    ], function(error, result) {
      if (error) {
        return res.status(500).json(error);
      }
      if (!result[0].allowCreate) {
        return res.status(500).json({message: 'New comment is not valid'});
      }

      kernel.module.Comment.attachModel(req.body.objectName);

      data.ownerId = req.user._id;
      if (req.body.isSubComment) {
        data.isSubComment = true;
      }
      let model = new kernel.model.Comment(data);
      model.save().then(comment => {
        kernel.queue.create(kernel.config.ES.events.CREATE, {type: kernel.config.ES.mapping.commentType, id: comment._id.toString(), data: comment}).save();
        comment.ownerId = req.user;
        return res.status(200).json(comment);
      }).catch(err => {
        return res.status(500).json(err);
      });
    });
  });
  
  /**
   * Get list comment parameter objectId, objectName
   */
  kernel.app.get('/api/v1/comments/:objectId/:objectName', (req, res) => {
    var page = req.query.page || 1;
    var pageSize = req.query.pageSize || kernel.config.COMMENT_PAGE_SIZE;
    var isSubComment = req.query.isSubComment || false;
    kernel.model.Comment.find({objectId:req.params.objectId, objectName:req.params.objectName, isSubComment: isSubComment}) 
    .limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .exec().then(comments => {
      async.parallel([
        (cb) => {
          kernel.model.Comment.count({objectId:req.params.objectId, objectName:req.params.objectName, isSubComment: isSubComment}).then(count => {
            cb(null, count);
          });
        },
        (cb) => {
          async.each(comments, (comment, callback) => {
            kernel.model.User.findById(comment.ownerId, '-password -salt').populate('avatar').exec().then(user => {
              comment.ownerId = user;
              callback()
            }).catch(callback);
          }, cb);
        }
      ], (err, result) => {
        return res.status(200).json({comments: comments, totalItem: result[0]});
      });
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Update comment parameter id 
   */
  kernel.app.put('/api/v1/comments/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    var schema = Joi.object().keys({ 
      content: Joi.string().min(kernel.config.COMMENT_VALIDATORS.minLength).required()
    });
    var result = Joi.validate(req.body, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    kernel.model.Comment.findById(req.params.id)
    .then(comment =>{
      if (!comment){
        return res.status(404).json({message: 'Comment not found'});
      }
      if (comment.deleted) {
        return res.status(422).json({message: 'This comment was deleted'});
      }
      async.parallel([
        (cb) => {
          kernel.model[comment.objectName].findById(comment.objectId).then(data => {
            if (comment.objectName==='Feed') {
              if (data.eventId) {
                cb(null, {type: 'Event', _id: data.eventId});
              } else {
                cb(null, {type: 'User', _id: data.userId});
              }
            } else if (comment.objectName==='Photo') {
              async.waterfall([
                // Check all feed to get event id
                (callback) => {
                  kernel.model.Feed.findOne({photosId: data._id}).then(data => {
                    if (!data) {
                      callback(null, {eventId: null});
                    } else {
                      callback(null, {eventId: data.eventId});
                    }
                  }).catch(callback);
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    kernel.model.Event.findOne({photosId: data._id}).then(data => {
                      if (!data) {
                        callback(null, {eventId: null});
                      } else {
                        callback(null, {eventId: data._id});
                      }
                    });
                  } else {
                    callback(null, result);
                  }
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    callback(null, {type: 'User', _id: data.ownerId});
                  } else {
                    callback(null, {type: 'Event', _id: result.eventId});
                  }
                }
              ], (err, result) => {
                if (err) {
                  return cb(err);
                }
                cb(null, result)
              });
            } else if (comment.objectName==='Comment') {
              // If it a sub-comment
              if (data.objectName==='Feed') {
                kernel.model[data.objectName].findById(data.objectId).then(feed => {
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else if (data.objectName==='Photo') {
                kernel.model.Feed.findOne({photosId: data.objectId}).then(feed => {
                  if (!feed) {
                    return cb(null, {type: 'User', _id: data.ownerId});
                  }
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else {
                cb({error: 'Not found'});
              }
            } else {
              cb({error: 'Not found'});
            }
          }).catch(cb);
        }
      ], (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        kernel.model[result[0].type].findById(result[0]._id).then(data => {
          if (!data) {
            return res.status(404).end();
          }
          let allow = false;
          if (result[0].type==='Event' && (req.user._id.toString()=== data.ownerId.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          } else if (result[0].type==='User' && (req.user._id.toString()=== data._id.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          }
          if (allow) {
            comment.content = req.body.content;
            comment.save().then(updated =>{
              return res.status(200).json(updated);
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});
            });
          } else {
            return res.status(403).end();
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      });
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Check user comment exists
   */
  kernel.app.get('/api/v1/comments/:objectId/:objectName/check', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Comment.findOne({ objectId: req.params.objectId, objectName:req.params.objectName, ownerId: req.user._id})
    .then(comment =>{
      if (!comment) {
        return res.status(200).json({existed:false});
      } else {
        return res.status(200).json({existed:true});
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Delete comment parameter id 
   */
  kernel.app.delete('/api/v1/comments/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Comment.findById(req.params.id).then(comment =>{
      if (!comment) {
        return res.status(404).end();
      }
      if (comment.deleted) {
        return res.status(200).end();
      }
      async.parallel([
        (cb) => {
          kernel.model[comment.objectName].findById(comment.objectId).then(data => {
            if (comment.objectName==='Feed') {
              if (data.eventId) {
                cb(null, {type: 'Event', _id: data.eventId});
              } else {
                cb(null, {type: 'User', _id: data.userId});
              }
            } else if (comment.objectName==='Photo') {
              async.waterfall([
                // Check all feed to get event id
                (callback) => {
                  kernel.model.Feed.findOne({photosId: data._id}).then(data => {
                    if (!data) {
                      callback(null, {eventId: null});
                    } else {
                      callback(null, {eventId: data.eventId});
                    }
                  }).catch(callback);
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    kernel.model.Event.findOne({photosId: data._id}).then(data => {
                      if (!data) {
                        callback(null, {eventId: null});
                      } else {
                        callback(null, {eventId: data._id});
                      }
                    });
                  } else {
                    callback(null, result);
                  }
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    callback(null, {type: 'User', _id: data.ownerId});
                  } else {
                    callback(null, {type: 'Event', _id: result.eventId});
                  }
                }
              ], (err, result) => {
                if (err) {
                  return cb(err);
                }
                cb(null, result)
              });
            } else if (comment.objectName==='Comment') {
              // If it a sub-comment
              if (data.objectName==='Feed') {
                kernel.model[data.objectName].findById(data.objectId).then(feed => {
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else if (data.objectName==='Photo') {
                kernel.model.Feed.findOne({photosId: data.objectId}).then(feed => {
                  if (!feed) {
                    return cb(null, {type: 'User', _id: data.ownerId});
                  }
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else {
                cb({error: 'Not found'});
              }
            } else {
              cb({error: 'Not found'});
            }
          }).catch(cb);
        }
      ], (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        kernel.model[result[0].type].findById(result[0]._id).then(data => {
          if (!data) {
            return res.status(404).end();
          }
          let allow = false;
          if (result[0].type==='Event' && (req.user._id.toString()=== data.ownerId.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          } else if (result[0].type==='User' && (req.user._id.toString()=== data._id.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          }
          if (allow) {
            comment.deleted = true;
            comment.deletedByUserId = (comment.deleted) ? req.user._id : null;
            // we not delete the comment. We just update status of the comment
            comment.save().then(() => {
              return res.status(200).end();
            }).catch(err => {
              return res.status(500).json(err);
            });
          } else {
            return res.status(403).end();
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      });
    }).catch(err => {
      return res.status(500).json(err);
    });
  });

  /*
  Block comment
  */
  kernel.app.put('/api/v1/comments/:id/block', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Comment.findById(req.params.id).then(comment => {
      if (!comment) {
        return res.status(404).end();
      }
      async.parallel([
        (cb) => {
          kernel.model[comment.objectName].findById(comment.objectId).then(data => {
            if (comment.objectName==='Feed') {
              if (data.eventId) {
                cb(null, {type: 'Event', _id: data.eventId});
              } else {
                cb(null, {type: 'User', _id: data.userId});
              }
            } else if (comment.objectName==='Photo') {
              async.waterfall([
                // Check all feed to get event id
                (callback) => {
                  kernel.model.Feed.findOne({photosId: data._id}).then(data => {
                    if (!data) {
                      callback(null, {eventId: null});
                    } else {
                      callback(null, {eventId: data.eventId});
                    }
                  }).catch(callback);
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    kernel.model.Event.findOne({photosId: data._id}).then(data => {
                      if (!data) {
                        callback(null, {eventId: null});
                      } else {
                        callback(null, {eventId: data._id});
                      }
                    });
                  } else {
                    callback(null, result);
                  }
                }, 
                (result, callback) => {
                  if (!result.eventId) {
                    callback(null, {type: 'User', _id: data.ownerId});
                  } else {
                    callback(null, {type: 'Event', _id: result.eventId});
                  }
                }
              ], (err, result) => {
                if (err) {
                  return cb(err);
                }
                cb(null, result)
              });
            } else if (comment.objectName==='Comment') {
              // If it a sub-comment
              if (data.objectName==='Feed') {
                kernel.model[data.objectName].findById(data.objectId).then(feed => {
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else if (data.objectName==='Photo') {
                kernel.model.Feed.findOne({photosId: data.objectId}).then(feed => {
                  if (!feed) {
                    return cb(null, {type: 'User', _id: data.ownerId});
                  }
                  if (feed.eventId) {
                    cb(null, {type: 'Event', _id: feed.eventId});
                  } else {
                    cb(null, {type: 'User', _id: feed.userId});
                  }
                }).catch(cb);
              } else {
                cb({error: 'Not found'});
              }
            } else {
              cb({error: 'Not found'});
            }
          }).catch(cb);
        }
      ], (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        kernel.model[result[0].type].findById(result[0]._id).then(data => {
          if (!data) {
            return res.status(404).end();
          }
          let allow = false;
          if (result[0].type==='Event' && (req.user._id.toString()=== data.ownerId.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          } else if (result[0].type==='User' && (req.user._id.toString()=== data._id.toString() || comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
            allow = true;
          }
          if (allow) {
            comment.blocked = !comment.blocked;
            comment.blockedByUserId = (comment.deleted) ? req.user._id : null;
            comment.save().then(() => {
              return res.status(200).end();
            }).catch(err => {
              return res.status(500).json(err);
            });
          } else {
            return res.status(403).end();
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      });
    });
  });
};
