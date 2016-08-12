import Joi from 'joi';
import multer from 'multer';
import async from 'async';
import _ from 'lodash';

module.exports = function(kernel) {
  /**
   * Create new award
   */
  kernel.app.post('/api/v1/awards/', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.queue.create('TOTAL_EVENT_JOINED', {userId: req.user._id}).save();
    if (req.user.deleted && req.user.deleted.status) {
      return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
    }
    if (req.user.blocked && req.user.blocked.status) {
      return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
    }
    
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, kernel.config.tmpPhotoFolder)
      },
      filename: (req, file, cb) => {
        return cb(null, file.originalname);
      }
    });
    let upload = multer({
      storage: storage
    }).single('file');

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      if (!req.file) {
        return res.status(422).json({type: 'AWARD_IMAGE_REQUIRED', path: 'photo', message: 'Award image is required'});
      }
      if (!req.body.award) {
        return res.status(422).json({type: 'AWARD_MISSING_ENTITIES', path: 'all', message: 'Award is missing some entities'});
      }
      // validate 
      var award = {
        objectName: req.body.award.name,
        type: req.body.award.type,
        ownerId: req.user._id
      };
      var schema = Joi.object().keys({
        objectName: Joi.string().required().options({
          language: {
            key: 'name'
          }
        }),
        type: Joi.string().required().options({
          language: {
            key: 'type'
          }
        })
      });
      
      var result = Joi.validate(award, schema, {
        stripUnknown: true,
        abortEarly: false,
        allowUnknown: true
      });

      if (result.error) {
        var errors = [];
        result.error.details.forEach(error => {
          var type;
          switch (error.type) {
            case 'string.name': 
              type = 'AWARD_NAME_REQUIRED';
              break;
            case 'string.type':
              type = 'AWARD_TYPE_REQUIRED';
              break;
            default:
              break;
          }
          errors.push({type: type, path: error.path, message: error.message});
        });
        return res.status(422).json(errors);
      }

      var photo = {
        ownerId: req.user._id,
        metadata: {
          tmp: req.file.filename
        }
      };
      let model = new kernel.model.Photo(photo);
      model.save().then(saved => {
        // create a queue to resize and upload to s3
        kernel.queue.create('PROCESS_AWS', saved).save();
        award.objectPhotoId = saved._id;
        let awardModel = new kernel.model.Award(award);
        awardModel.save().then(result => {
          result.objectPhotoId = saved;
          return res.status(200).json(result);
        }).catch(() => {
          // remove upload photo when save award error
          saved.remove().exec().then(() => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }).catch(() => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      });
    });
  });
  
  /**
   * Get list of awards created by current user
   */
  kernel.app.get('/api/v1/awards/:id/all', kernel.middleware.isAuthenticated(), (req, res) => {
    let condition = {};
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 10;
    // let defaultAwardLoaded = req.params.defaultAwardLoaded || false;
    if (req.params.id==='me') {
      condition = {ownerId: req.user._id};
    } else if (req.params.id==='null' && req.user.role==='admin') {
      condition = {};
    } else {
      condition = {ownerId: req.params.id};
    }
    // if current user id admin then load all records
    if (req.user.role!=='admin') {
      condition.$or = [{deleted: null}, {deleted: false}];
    }
    kernel.model.Award.find(condition)
    .limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .populate('objectPhotoId')
    .populate('ownerId', '-password -salt')
    .exec().then(awards => {
      let defaultAwards = [];
      async.parallel([
        (cb) => {
          if (page===1) {
            // get default awards
            let defaultAwards = ['Foodstar Point', 'Sportstar Point', 'Socialstar Point', 'Actionstar Point', 'Ecostar Point'];
              kernel.model.Award.find({objectName: {$in: defaultAwards}}).then(defaultAwards => {
                defaultAwards = defaultAwards;
                cb(null);
              }).catch(cb);
          } else {
            cb(null);
          }
        }
      ], () => {
        awards = awards.concat(defaultAwards);
        awards = _.map(_.groupBy(awards,function(doc){
          return doc._id;
        }),function(grouped){
          return grouped[0];
        });
        kernel.model.Award.count(condition).then(count => {
          // This params is get from awards backend
          if (req.params.id==='null' && req.user.role==='admin') {
            let results = [];
            async.each(awards, (award, callback) => {
              award = award.toJSON();
              kernel.model.Event.findOne({awardId: award._id}).then(event => {
                award.event = (event) ? event : null;
                results.push(award);
                callback();
              }).catch(callback);
            }, (err) => {
              if (err) {
                return res.status(500).json({type: 'SERVER_ERROR'});
              }
              return res.status(200).json({items: results, totalItem: (page===1) ? count+5 : count});
            });
          } else {
            return res.status(200).json({items: awards, totalItem: (page===1) ? count+5 : count});
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*
  get list of granted awards by current user
  */
  kernel.app.get('/api/v1/awards/:id/grantedAwards', kernel.middleware.isAuthenticated(), (req, res) => {
    let condition = {};
    if (req.params.id==='me') {
      condition = {ownerId: req.user._id};
    } else {
      condition = {ownerId: req.params.id};
    }
    // if current user id admin then load all records
    if (req.user.role!=='admin') {
      condition.$or = [{deleted: null}, {deleted: false}];
    }
    kernel.model.GrantAward.find(condition)
    .populate({
      path: 'awardId', 
      populate: {path: 'objectPhotoId', model: 'Photo'}
    })
    .populate({
      path: 'eventId', 
      populate: {path: 'categoryId', model: 'Category'}
    }).exec().then(awards => {
      let result = [];
      async.each(awards, (award, callback) => {
        let aw = award.toJSON();
        kernel.model.User.findById(award.eventId.ownerId, '-password -salt')
        .populate('avatar')
        .then(u => {
          if (u) {
            let user = u.toJSON();
            kernel.model.GrantAward.count({ownerId: user._id}).then(count => {
              user.totalAwards = count;
              aw.eventId.ownerId = user;
              result.push(aw);
              callback();
            }).catch(callback);
          } else {
            result.push(aw);
            callback({error: 'User not found'});
          }
        }).catch(callback);
      }, (err) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        return res.status(200).json({items: result, totalItem: result.length});
      });
    }).catch(err => {
      console.log(err);
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Delete award if he an owner or has admin role*/
  kernel.app.delete('/api/v1/awards/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Award.findById(req.params.id).then(award => {
      if (!award) {
        return res.status(404).end();
      }
      if (req.user._id.toString()===award.ownerId.toString() || req.user.role==='admin') {
        award.deleted = true;
        award.deletedBy = req.user._id;
        award.save().then(() => {
          return res.status(200).end();
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

  /*Update award detail*/
  kernel.app.put('/api/v1/awards/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Award.findById(req.params.id).then(award => {
      if (!award) {
        return res.status(404).end();
      }
      if (award.ownerId.toString()===req.user._id.toString() || req.user.role==='admin') {
        let storage = multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, kernel.config.tmpPhotoFolder)
          },
          filename: (req, file, cb) => {
            return cb(null, file.originalname);
          }
        });
        let upload = multer({
          storage: storage
        }).single('file');

        upload(req, res, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }
          if (!req.body.award) {
            return res.status(422).json({type: 'AWARD_MISSING_ENTITIES', path: 'all', message: 'Award is missing some entities'});
          }
          // validate 
          var awardValidation = {
            objectName: req.body.award.objectName,
            type: req.body.award.type,
            ownerId: req.user._id
          };
          var schema = Joi.object().keys({
            objectName: Joi.string().required().options({
              language: {
                key: 'name'
              }
            }),
            type: Joi.string().required().options({
              language: {
                key: 'type'
              }
            })
          });
          
          var result = Joi.validate(awardValidation, schema, {
            stripUnknown: true,
            abortEarly: false,
            allowUnknown: true
          });

          if (result.error) {
            var errors = [];
            result.error.details.forEach(error => {
              var type;
              switch (error.type) {
                case 'string.name': 
                  type = 'AWARD_NAME_REQUIRED';
                  break;
                case 'string.type':
                  type = 'AWARD_TYPE_REQUIRED';
                  break;
                default:
                  break;
              }
              errors.push({type: type, path: error.path, message: error.message});
            });
            return res.status(422).json(errors);
          }

          async.parallel([
            (cb) => {
              if (req.file) {
                kernel.model.Photo.findById(award.objectPhotoId).then(photo => {
                  if (!photo) {
                    return cb({error: 'Photo not found', code: '404'});
                  } 
                  photo.metadata = {
                   tmp: req.file.filename 
                  };
                  photo.save().then(saved => {
                    console.log(saved);
                    kernel.queue.create('PROCESS_AWS', saved).save();
                    cb(null);
                  }).catch(cb);
                }).catch(cb);
              } else {
                cb(null);
              }
            }
          ], (err) => {
            if (err) {
              return res.status(500).json({type: 'SERVER_ERROR'});
            }
            award.objectName = req.body.award.objectName;
            award.type = req.body.award.type;
            award.save().then(saved => {
              kernel.model.Photo.findById(award.objectPhotoId).then(photo => {
                let data = saved.toJSON();
                data.objectPhotoId = (photo) ? photo : data.objectPhotoId;
                return res.status(200).json(data);
              }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});  
              });
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});
            });
          });
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};