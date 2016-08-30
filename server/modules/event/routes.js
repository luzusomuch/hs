import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
import moment from 'moment';
import {EventBus} from '../../components';

module.exports = function(kernel) {
  kernel.app.post('/api/v1/events', kernel.middleware.isAuthenticated(), (req, res) => {
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
    }).array('file');

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      let uploadedPhotoIds = [];
      let newBannerId;
      // validation
      if (req.user.deleted && req.user.deleted.status) {
        return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
      }
      if (req.user.blocked && req.user.blocked.status) {
        return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
      }

      if (!req.body.event.award) {
        return res.status(422).json({type: 'EVENT_AWARD_REQUIRED', path: 'award', message: 'Award is required'});
      }

      kernel.model.Category.findById(req.body.event.categoryId).then(category => {
        if (!category) {
          return res.status(404).end();
        }
        if (category.type!=='action' && !req.body.event.location.fullAddress) {
          return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
        } else if (category.type==='action') {
          req.body.event.location = {
            coordinates: [0, 0]
          };
        }
        var data = {
          name: req.body.event.name,
          description: req.body.event.description,
          categoryId: req.body.event.categoryId,
          startDateTime: req.body.event.startDateTime,
          endDateTime: req.body.event.endDateTime,
          awardId: req.body.event.award._id
        };
        data.ownerId = req.user._id;
        data.organizerId = req.user._id;
        data.public = (req.body.event.public==='true') ? true : false;
        data.private = !data.public;
        data.location = req.body.event.location;
        if (req.body.event.participants) {
          if (req.body.event.participants._id instanceof Array) {
            data.participantsId = req.body.event.participants._id;
          } else {
            data.participantsId = [req.body.event.participants._id];
          }
        } else {
          data.participantsId = [];
        }
        if (req.body.event.isRepeat === 'true') {
          var repeatTypes = ['daily', 'weekly', 'monthly'];
          if (!req.body.event.repeat.startDate || !req.body.event.repeat.endDate || !req.body.event.repeat.type) {
            return res.status(422).json({type: 'EVENT_REPEATING_MISSING_ENTITIES', path: 'repeat', message: 'Event repeat is missing some entities'}); 
          }
          if (repeatTypes.indexOf(req.body.event.repeat.type) === -1) {
            return res.status(422).json({type: 'EVENT_REPEATING_ENTITY_NOT_VALID', path: 'repeat', message: 'Event repeat entity is not valid'});
          }
          data.repeat = req.body.event.repeat;
        }

        var schema = Joi.object().keys({
          name: Joi.string().required().options({
            language: {
              key: 'name'
            }
          }),
          description: Joi.string().required().options({
            language: {
              key: 'description'
            }
          }),
          categoryId: Joi.string().required().options({
            language: {
              key: 'categoryId'
            }
          }),
          startDateTime: Joi.date().required().options({
            language: {
              key: 'startDateTime'
            }
          }),
          endDateTime: Joi.date().required().options({
            language: {
              key: 'endDateTime'
            }
          }),
          awardId: Joi.string().required().options({
            language: {
              key: 'award'
            }
          }),
          participantsId: Joi.array(Joi.string()).default([])
        });
        var result = Joi.validate(data, schema, {
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
                type = 'EVENT_NAME_REQUIRED';
                break;
              case 'string.description':
                type = 'EVENT_DESCRIPTION_REQUIRED';
                break;
              case 'string.categoryId': 
                type = 'EVENT_CATEGORY_REQUIRED';
                break;
              case 'string.startDateTime':
                type = 'EVENT_START_DATE_TIME_REQUIRED';
                break;
              case 'string.endDateTime': 
                type = 'EVENT_END_DATE_TIME_REQUIRED';
                break;
              case 'string.award':
                type = 'EVENT_AWARD_REQUIRED';
                break;
              case 'string.public':
                type = 'EVENT_STATUS';
                break;
              default:
                break;
            }
            errors.push({type: type, path: error.path, message: error.message});
          });
          // return kernel.errorsHandler.parseError(errors);
          return res.status(422).json(errors);
        }

        if (moment(moment(data.startDateTime).format('YYYY-MM-DD HH:mm')).isSameOrAfter(moment(data.endDateTime).format('YYYY-MM-DD HH:mm'))) {
          return res.status(422).json({type: 'CHECK_DATE_TIME_AGAIN', path: 'datetime', message: 'Check your date time again'})
        }

        async.each(req.files, (file, callback) => {
          var photo = {
            ownerId: req.user._id,
            metadata: {
              tmp: file.filename
            }
          };
          let model = new kernel.model.Photo(photo);
          model.save().then(saved => {
            if (req.body.event.bannerName && req.body.event.bannerName===file.filename) {
              newBannerId = saved._id;
            } else {
              uploadedPhotoIds.push(saved._id);
            }
            kernel.queue.create('PROCESS_AWS', saved).save();
            callback(null, uploadedPhotoIds);
          }).catch(err => {
            callback(err);
          });
        }, () => {
          data.photosId = uploadedPhotoIds;
          if (req.body.event.bannerName && req.body.event.bannerName !== 'null') {
            data.banner = newBannerId;
          }
          data.stats = {
            totalParticipants: data.participantsId.length
          };
          let model = new kernel.model.Event(data);
          model.save().then(event => {
            var url = kernel.config.baseUrl + 'event/'+event._id;
            async.each(event.participantsId, (id, cb) => {
              kernel.model.User.findById(id, (err, user) => {
                if (err || ! user) {return cb();}
                kernel.emit('SEND_MAIL', {
                  template: 'event-created.html',
                  subject: 'New Event Created Named ' + event.name,
                  data: {
                    user: user, 
                    url: url,
                    event: event
                  },
                  to: user.email
                });
                cb();
              });
            }, () => {
              kernel.queue.create(kernel.config.ES.events.CREATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
              kernel.queue.create('GRANT_AWARD', event).save();
              kernel.queue.create('TOTAL_EVENT_CREATED', {userId: req.user._id}).save();
              // get all user then update real-time count update in home page
              kernel.model.User.find({}).then(users => {
                users.forEach(user => {
                  EventBus.emit('socket:emit', {
                    event: 'tracking:count-new-event',
                    room: user._id.toString(),
                    data: event
                  });
                });
                return res.status(200).json(event);
              }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});
              });
            });
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'}); 
      });
    });
  });

  /*Get selected user's events list*/
  /*req.query.getAll just show in current user's calendar*/
  kernel.app.get('/api/v1/events/user-events', kernel.middleware.isAuthenticated(), (req, res) => {
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 10;
    let skip = (page -1) * pageSize;
    let date = moment(new Date());
    let must = [{ term: { blocked: false } }];

    if (!req.query.getAll) {
      must.push({ term: { private: false } })
    }

    let query = {
      query: {
        filtered: {
          query: {
            bool: {
              should: []
            }
          },
          filter: {
            bool: {
              must: must,
              should: [
                { term: { ownerId: (req.query.userId) ? req.query.userId : req.user._id}},
                { term: { participantsId: (req.query.userId) ? req.query.userId : req.user._id}}
              ]
            }
          }
        }
      },
      from: skip,
      size: pageSize,
      sort: [
        { createdAt: 'desc' }
      ]
    };

    if (req.query.getAll) {
      query = _.omit(query, 'from');
      query = _.omit(query, 'size');
    }

    kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }

      let results = {items: [], totalItem: result.totalItem};

      async.each(result.items, (item, callback) => {
        kernel.model.Event.findById(item._id)
        .populate('photosId')
        .populate('categoryId')
        .exec().then(event => {
          if (!event) {
            return callback(null);
          }
          results.items.push(event);
          callback(null);
        }).catch(callback);
      }, (err) => {
        return res.status(200).json(results);
      });
    });
  });

  // Get events list for current user base on friends
  kernel.app.get('/api/v1/events/friendsEvents', kernel.middleware.isAuthenticated(), (req, res) => {
    // Get all friends
    kernel.model.Relation.find({
      type: 'friend', 
      status: 'completed', 
      $or: [{fromUserId: req.user._id}, {toUserId: req.user._id}]
    }).then(friends => {
      if (friends.length === 0) {
        return res.status(200).json({events: []});
      }
      let friendIds = _.map(friends, (friend) => {
        return friend.fromUserId.toString() === req.user._id.toString() ? friend.toUserId : friend.fromUserId;
      });

      let page = parseInt(req.query.page);
      let limit = parseInt(req.query.page);
      page = (page === 'NaN' || !page) ? 1 : page;
      limit = (limit === 'NaN' || !limit || limit < 8 || limit > 100) ? 3 : limit;
      let skip = (page - 1) * limit;

      let q = {
        query: {
          filtered: {
            query: {
              bool: {
                should: []
              }
            },
            filter: {
              bool: {
                must: [
                  { term: { blocked: false } }
                ],
                should: [
                  { missing: { field: 'private' } },
                  { term: { private: false } },
                  { term: { participantsId: friendIds}},
                  { term: { ownerId: friendIds}}
                ]
              }
            }
          }
        },
        from: skip,
        size: limit,
        sort: [
          { createdAt: 'desc' }
        ]
      };
      kernel.ES.search(q, kernel.config.ES.mapping.eventType, (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        let results = [];
        async.each(result.items, (item, callback) => {
          async.waterfall([
            (cb) => {
              kernel.model.Award.findById(item.awardId).then(award => {
                if (!award) {
                  return cb(null, item);
                }
                item.awardId = award;
                cb(null, item);
              }).catch(cb);
            },
            (result, cb) => {
              kernel.model.Category.findById(result.categoryId).then(category => {
                if (!category) {
                  return cb(null, result);
                }
                result.categoryId = category;
                cb(null, result);
              }).catch(cb);
            }, 
            (result, cb) => {
              kernel.model.User.findById(result.ownerId, '-password -salt')
              .populate('avatar').exec().then(owner => {
                if (!owner) {
                  return cb(null, result);
                }
                kernel.model.GrantAward.count({ownerId: owner._id}).then(count => {
                  owner.totalAwards = count;
                  result.ownerId = owner;
                  cb(null, result);
                }).catch(err => {
                  owner.totalAwards = 0;
                  result.ownerId = owner;
                  cb(null, result);
                })
              }).catch(cb);
            }, 
            (result, cb) => {
              let participants = [];
              async.each(result.participantsId, (userId, _callback) => {
                kernel.model.User.findById(userId, '-password -salt')
                .populate('avatar').exec().then(participant => {
                  if (!participant) {
                    participants.push(userId);
                    _callback(null);
                  } else {
                    participants.push(participant);
                    _callback(null);
                  }
                }).catch(_callback);
              }, () => {
                result.participantsId = participants;
                cb(null, result);
              });
            },
            (result, cb) => {
              cb(null, result);
            }
          ], (err, result) => {
            results.push(result);
            callback();
          });
          // if (item.ownerId && item.ownerId._id && item.awardId) {
          //   kernel.model.GrantAward.findOne({ownerId: (item.ownerId._id) ? item.ownerId._id : item.ownerId, eventId: item._id, awardId: item.awardId._id}).then(award => {
          //     data.isGrantedAward = (award) ? true : false;
          //     item.ownerId = data;
          //     callback();
          //   }).catch(callback);
          // } else {
          //   callback();
          // }
        }, () => {
          return res.status(200).json({items: results, totalItem: result.totalItem});
        });
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
    

  /* suggest for searching */
  kernel.app.get('/api/v1/events/suggest', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!req.query.keyword) {
      return res.status(200).json([]);
    }
    var regexp = '(.*)*'+req.query.keyword+'(.*)*';
    let query = {
      query: {
        regexp: {
          name: regexp
        }
      },
      from: 0,
      size: 10
    };
    console.log(JSON.stringify(query));
    //Todo: filter based on query

    kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
      if(err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      let suggests = _.map(result.items, 'name');
      return res.status(200).json(suggests);
    });

  });

  /*
  Get Event Detail
  */
  kernel.app.get('/api/v1/events/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }
    kernel.model.Event.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { participantsId: { $in: [req.user._id] } },
        { private: { $exists: false } },
        { private: false }
      ]
    })
    .populate('ownerId', '-password -salt')
    .populate('categoryId')
    .populate('photosId')
    .populate('banner')
    .populate({
      path: 'awardId', 
      populate: {path: 'objectPhotoId', model: 'Photo'}
    })
    .populate({
      path: 'participantsId', 
      select: '-password -salt',
      populate: {path: 'avatar', model: 'Photo'}
    })
    .exec().then(event => {
      if (!event) {
        return res.status(404).json({type: 'EVENT_NOT_FOUND', message: 'Event not found'});
      }
      return res.status(200).json(event);
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Update event*/
  kernel.app.put('/api/v1/events/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
       return res.status(404).json({type: 'EVENT_NOT_FOUND', message: 'Event not found'}); 
      }
      if (event.ownerId.toString()===req.user._id.toString() || req.user.role==='admin') {
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
        }).array('file');

        upload(req, res, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }
          // validation
          if (req.user.deleted && req.user.deleted.status) {
            return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
          }
          if (req.user.blocked && req.user.blocked.status) {
            return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
          }

          if (!req.body.event.award) {
            return res.status(422).json({type: 'EVENT_AWARD_REQUIRED', path: 'award', message: 'Award is required'});
          }
          kernel.model.Category.findById(req.body.event.categoryId).then(category => {
            if (!category) {
              return res.status(404).end();
            }
            if (category.type!=='action' && !req.body.event.location.fullAddress) {
              return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
            } else if (category.type==='action') {
              req.body.event.location = {
                coordinates: [0, 0],
                type: 'Point'
              };
            }
            var data = {
              name: req.body.event.name,
              description: req.body.event.description,
              categoryId: req.body.event.categoryId,
              startDateTime: req.body.event.startDateTime,
              endDateTime: req.body.event.endDateTime,
              awardId: req.body.event.award._id
            };

            var schema = Joi.object().keys({
              name: Joi.string().required().options({
                language: {
                  key: 'name'
                }
              }),
              description: Joi.string().required().options({
                language: {
                  key: 'description'
                }
              }),
              categoryId: Joi.string().required().options({
                language: {
                  key: 'categoryId'
                }
              }),
              startDateTime: Joi.date().required().options({
                language: {
                  key: 'startDateTime'
                }
              }),
              endDateTime: Joi.date().required().options({
                language: {
                  key: 'endDateTime'
                }
              }),
              awardId: Joi.string().required().options({
                language: {
                  key: 'award'
                }
              })
            });
            var result = Joi.validate(data, schema, {
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
                    type = 'EVENT_NAME_REQUIRED';
                    break;
                  case 'string.description':
                    type = 'EVENT_DESCRIPTION_REQUIRED';
                    break;
                  case 'string.categoryId': 
                    type = 'EVENT_CATEGORY_REQUIRED';
                    break;
                  case 'string.startDateTime':
                    type = 'EVENT_START_DATE_TIME_REQUIRED';
                    break;
                  case 'string.endDateTime': 
                    type = 'EVENT_END_DATE_TIME_REQUIRED';
                    break;
                  case 'string.award':
                    type = 'EVENT_AWARD_REQUIRED';
                    break;
                  case 'string.public':
                    type = 'EVENT_STATUS';
                    break;
                  default:
                    break;
                }
                errors.push({type: type, path: error.path, message: error.message});
              });
              return res.status(422).json(errors);
            }

            if (moment(moment(data.startDateTime).format('YYYY-MM-DD HH:mm')).isSameOrAfter(moment(data.endDateTime).format('YYYY-MM-DD HH:mm'))) {
              return res.status(422).json({type: 'CHECK_DATE_TIME_AGAIN', path: 'datetime', message: 'Check your date time again'})
            }

            // add or remove event photos
            if (req.body.event.photos) {
              if (req.body.event.photos instanceof Array) {
                event.photosId = req.body.event.photos;
              } else {
                event.photosId = [req.body.event.photos];
              }
            }
            // get unique photo id
            event.photosId = _.map(_.groupBy(event.photosId, (doc) => {
              return doc;
            }), (grouped) => {
              return grouped[0];
            });
            // update event photos to empty when client site has removed all
            if (Number(req.body.event.photosLength) === 0) {
              event.photosId = [];
            }
            // upload event photos
            let newBannerId;
            async.each(req.files, (file, callback) => {
              var photo = {
                ownerId: req.user._id,
                metadata: {
                  tmp: file.filename
                }
              };
              let model = new kernel.model.Photo(photo);
              model.save().then(saved => {
                if (req.body.event.bannerName && req.body.event.bannerName===file.filename) {
                  newBannerId = saved._id;
                } else {
                  event.photosId.push(saved._id);
                }
                kernel.queue.create('PROCESS_AWS', saved).save();
                callback(null);
              }).catch(err => {
                callback(err);
              });
            }, () => {
              // Update data
              event.name = req.body.event.name;
              event.description = req.body.event.description;
              event.categoryId = req.body.event.categoryId;
              event.startDateTime = req.body.event.startDateTime;
              event.endDateTime = req.body.event.endDateTime;
              event.awardId = req.body.event.award._id;
              event.public = (req.body.event.public==='true') ? true : false;
              event.private = !event.public;
              event.location = req.body.event.location;

              if (req.body.event.bannerName && req.body.event.bannerName !== 'null') {
                event.banner = newBannerId;
              }
              if (req.body.event.participants) {
                if (req.body.event.participants._id instanceof Array) {
                  event.participantsId = _.union(event.participantsId, req.body.event.participants._id);
                } else {
                  event.participantsId.push(req.body.event.participants._id);
                }
              } else {
                event.participantsId = [];
              }
              // get unique participants
              event.participantsId = _.map(_.groupBy(event.participantsId, (doc) => {
                return doc;
              }), (grouped) => {
                return grouped[0];
              });

              if (req.body.event.isRepeat === 'true') {
                var repeatTypes = ['daily', 'weekly', 'monthly'];
                if (!req.body.event.repeat.startDate || !req.body.event.repeat.endDate || !req.body.event.repeat.type) {
                  return res.status(422).json({type: 'EVENT_REPEATING_MISSING_ENTITIES', path: 'repeat', message: 'Event repeat is missing some entities'}); 
                }
                if (repeatTypes.indexOf(req.body.event.repeat.type) === -1) {
                  return res.status(422).json({type: 'EVENT_REPEATING_ENTITY_NOT_VALID', path: 'repeat', message: 'Event repeat entity is not valid'});
                }
                event.repeat = req.body.event.repeat;
              }
              event.stats.totalParticipants = event.participantsId.length;
              event.save().then(() => {
                kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
                return res.status(200).json({type: 'EVENT_UPDATE_SUCCESS', message: 'Event updated'});
              }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});
              });
            });
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /**
  * Get related events
  *
  */

  kernel.app.get('/api/v1/events/:id/related', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }

    kernel.model.Event.findById(req.params.id).then(
      event => {
        if(!event) {
          return res.status(500).json({type: 'EVENT_NOT_FOUND'});
        }
         async.waterfall([
          (cb) => {
             kernel.model.Event.find({
              _id: { $ne: event._id },
              categoryId: event.categoryId,
              createAt: { $lte: event.createAt },
              $or: [
                { ownerId: req.user._id },
                { participantsId: { $in: [req.user._id] } },
                { private: { $exists: false } },
                { private: false }
              ]
            })
            .sort({ createdAt: -1 })
            .limit(3)
            .exec(cb);
          },

          (events, cb) => {
            //TODO: count number of feeds of event
            kernel.model.Feed.aggregate([
              { 
                $match: {
                  eventId: { $in: _.map(events, e => e._id) }
                }
              },
              {
                $group: {
                  _id: '$eventId',
                  total: { $sum: 1 }
                }
              }
            ], (err, result) => {
              if(err) return cb(err);
              _.each(result, r => {
                let idx = _.findIndex(events, e => {
                  return e._id.toString() === r._id.toString();
                });
                if(idx !== -1) {
                  events[idx] = events[idx].toJSON();
                  events[idx].totalComment = r.total;
                }
              });
              return cb(null, events);
            });
          }
        ], (err, result) => {
          if(err) {
            return  res.status(500).json({type: 'SERVER_ERROR'});
          }
          return res.status(200).json(result);
        });
      })
    .catch(err => res.status(500).json({type: 'SERVER_ERROR'}));
  });

  /*
  Delete an event
  */
  kernel.app.delete('/api/v1/events/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
       return res.status(404).json({type: 'EVENT_NOT_FOUND', message: 'Event not found'}); 
      }
      if (event.ownerId.toString()===req.user._id.toString() || req.user.role==='admin') {
        event.blocked = true;
        event.blockedByUserId = req.user._id;
        event.save().then(saved => {
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: saved._id.toString(), data: saved}).save();
          kernel.queue.create('DELETE_EVENT', {event: saved, user: req.user}).save();
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

  /**
  * Get paticipants of an event
  */
  kernel.app.get('/api/v1/events/:id/participants', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }
    let pageSize = req.query.pageSize || 6;

    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      let response = {
        totalItem: event.participantsId.length,
        items: []
      };
      let ids = [];
      _.each(event.participantsId, (id, index) => {
        if (index < pageSize) {
          ids.push(id);
        }
      });
      kernel.model.User.find({_id: {$in: ids}}, '-password -salt').populate('avatar').exec().then(users => {
        async.each(users, (user, callback) => {
          user = user.toJSON();
          kernel.model.Relation.findOne({
            type: 'friend',
            $or: [{
              fromUserId: req.user._id, toUserId: user._id
            }, {
              fromUserId: user._id, toUserId: req.user._id
            }]
          }).then(relation => {
            if (!relation) {
              user.friendStatus = 'none';
              response.items.push(user);
              return callback(null);
            }
            user.friendStatus = relation.status;
            response.items.push(user);
            callback(null);
          }).catch(callback);
        }, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});    
          }
          return res.status(200).json(response);
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });


    // kernel.model.Event.findById(req.params.id).then(event => {
    //     if(!event) {
    //       return res.status(404);
    //     }
    //     let response = {
    //       total: event.participantsId.length,
    //       items: []
    //     };
    //     async.waterfall([
    //       (cb) => {
    //         kernel.model.Relation.find({
    //           $or: [{
    //             fromUserId: req.user._id 
    //           },{ 
    //             toUserId: req.user._id 
    //           }],
    //           type: 'friend',
    //           status: 'completed'
    //         }, (err, friends) => {
    //           if(err) return cb(err);
    //           let friendIds = _.map(friends, f => {
    //             return f.fromUserId.toString() === req.user._id.toString() ? f.toUserId : f.fromUserId;
    //           });
    //           return cb(null, friendIds);
    //         });
    //       },
    //       (friendIds, cb) => {
    //         if(!friendIds.length) return cb(null, []);
    //         kernel.model.User.find({
    //           $and: [
    //             {
    //               _id: { $in: event.participantsId }
    //             },
    //             {
    //               _id: { $in: friendIds}
    //             }
    //           ]
    //         }, '-salt -password').limit(LIMIT).exec((err, friends) => {
    //           if(err) return cb(err);
    //           return cb(null, _.map(friends, friend => {
    //             let user = friend.toJSON();
    //             user.isFriend = true;
    //             return user;
    //           }));
    //         });
    //       },
    //       (friends, cb) => {
    //         let remainingLimit = LIMIT - friends.length;
    //         let remainingLength = event.participantsId.length - friends.length;
    //         if(event.participantsId.indexOf(req.user._id) !== -1 ) remainingLength--;
    //         if(!remainingLimit || !remainingLength) return cb(null, friends);
    //         let skip = 0;
    //         // remainingLimit = 1
    //         // remainingLength = 7
    //         if(remainingLimit < remainingLength) {
    //           let start = 1;
    //           let end = remainingLength - remainingLimit + 1;
    //           skip = Math.floor((Math.random() * end) + start) - 1;
    //         }
    //         kernel.model.User.find({
    //           $and: [
    //             {
    //               _id: { $ne: req.user._id }
    //             },
    //             {
    //               _id: { $in: event.participantsId }
    //             },
    //             {
    //               _id: { $nin: _.map(friends, '_id') }
    //             }
    //           ]
    //         }, '-salt -password').limit(remainingLimit).skip(skip).exec((err, participants) => {
    //           if(err) return cb(err);
    //           return cb(null, friends.concat(participants));
    //         });
    //       }
    //     ], (err, items) => {
    //       if(err) return res.status(500).json({type: 'SERVER_ERROR'});
    //       let results = [];
    //       async.each(items, (item, callback) => {
    //         kernel.model.GrantAward.findOne({ownerId: item._id, eventId: event._id, awardId: event.awardId}).then(award => {
    //           let data = item;
    //           data.isGrantedAward = (award) ? true : false;
    //           results.push(data);
    //           callback();
    //         }).catch(err => {
    //           console.log(err);
    //           callback(err);
    //         });
    //       }, () => {
    //         response.items = results;
    //         return res.status(200).json(response);
    //       });
    //     });
    //   }
    // )
    // .catch(err => res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}));
  });

  /* Get event */

  kernel.app.post('/api/v1/events/search', kernel.middleware.isAuthenticated(), (req, res) => {
    let page = parseInt(req.body.page);
    let limit = parseInt(req.body.page);
    page = (page === 'NaN' || !page) ? 1 : page;
    limit = (limit === 'NaN' || !limit || limit < 8 || limit > 100) ? 8 : limit;
    let skip = (page - 1) * limit;

    let term = [];
    let must = [];
    if (req.user.role!=='admin') {
      term = [
        { missing: { field: 'private' } },
        { term: { private: false } },
        { term: { participantsId: req.user._id } },
        { term: { ownerId: req.user._id} }
      ];
      must = [{ term: { blocked: false } }];
    }

    let q = {
      query: {
        filtered: {
          query: {
            bool: {
              should: []
            }
          },
          filter: {
            bool: {
              must: must,
              should: term
            }
          }
        }
      },
      from: skip,
      size: limit,
      sort: [
        { createdAt: 'desc' }
      ]
    };

    // process keywords
    if(req.body.keywords && typeof req.body.keywords === 'string') {
      let keywords = req.body.keywords.split(',');
      _.each(keywords, key => {
        q.query.filtered.query.bool.should.push({match: {name: key}});
        q.query.filtered.query.bool.should.push({term: {tags: key}});
      });
    }


    //process categoryid 
    if(req.body.categories instanceof Array && req.body.categories.length) {
      q.query.filtered.filter.bool.must.push({terms: {categoryId: req.body.categories}});
    }

    if(req.body.category) {
      q.query.filtered.filter.bool.must.push({term: {categoryId: req.body.category}});
    }

    //process dates
    if(req.body.dates instanceof Array && req.body.dates.length) {
      let should = [];
      _.each(req.body.dates, dateString => {
        let time = parseInt(dateString);
        let date = moment(new Date(time));
        if(date.isValid()) {
          should.push({
            range: {
              startDateTime: {
                gte: date.startOf('date').toISOString(),
                lte: date.endOf('date').toISOString()
              }
            }
          });
        }
      });
      if(should.length) {
        q.query.filtered.filter.bool.must.push({
          bool: {
            should: should
          } 
        });
      }
    }

    //process date
    if(req.body.startDate) {
      let time = parseInt(req.body.startDate);
      let date = moment(new Date(time));
      if(date.isValid()) {
        q.query.filtered.filter.bool.must.push({
          range: {
            startDateTime: {
              gte: date.startOf('date').toISOString(),
              lte: date.endOf('date').toISOString()
            }
          }
        });
      }
    }

    //process location
    let radius = parseInt(req.body.radius);
    let locationCheck = req.body.location && req.body.location.lat && req.body.location.lng && radius && radius !== 'NaN';
    if(locationCheck) {
      q.query.filtered.filter.bool.must.push({
        geo_distance: {
          distance: radius + 'km',
          'location.coordinates': [req.body.location.lng, req.body.location.lat], 
        }
      });
    }

    //process friend activities
    let funcs = [];
    if(req.body.friendActivities) {
        let getFriends =  (cb) => {
          kernel.model.Relation.find({
            type: 'friend', 
            status: 'completed', 
            $or: [{fromUserId: req.user._id}, {toUserId: req.user._id}]
          }).then(friends => {
            if (friends.length === 0) {
              return cb(null, []);
            }
            let friendIds = _.map(friends, (friend) => {
              return friend.fromUserId.toString() === req.user._id.toString() ? friend.toUserId : friend.fromUserId;
            });
            return cb(null, friendIds);
          }, cb);
        }
      funcs.push(getFriends);
    }

    if(!funcs.length) {
      funcs.push((cb) => {
        return cb(null, null);
      });
    }

    let queryResult = (friendIds, cb) => {
      if(friendIds) {
        q.query.filtered.filter.bool.must.push({ terms: {ownerId : friendIds} });
      }
      return cb(null, q);
    };

    funcs.push(queryResult);

    let getEvents = (query, _cb) => {
      kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
        if(err) {
          return _cb(err);
        }
        async.each(result.items, (item, callback) => {
          item.liked = false;
          async.parallel([
            (cb) => {
              // populate ownerId
              kernel.model.User.findById(item.ownerId, '-password -salt')
              .populate('avatar').exec().then(u => {
                if (u) {
                  let user = u.toJSON();
                  kernel.model.GrantAward.count({ownerId: user._id, deleted: false}).then(count => {
                    user.totalAwards = count;
                    item.ownerId = user;
                    cb();
                  }).catch(err => {
                    user.totalAwards = 0;
                    cb();
                  });
                } else {
                  cb();
                }
              }).catch(cb);
            }, 
            (cb) => {
              // populate categoryId
              kernel.model.Category.findById(item.categoryId).then(category => {
                item.categoryId = (category) ? category : item.categoryId;
                cb();
              }).catch(cb);
            }, 
            (cb) => {
              // Check that current user liked an event or not
              kernel.model.Like.findOne({objectId: item._id, objectName: 'Event', ownerId: req.user._id}).then(liked => {
                if (!liked) {
                  return cb();
                }
                item.liked = true;
                cb();
              }).catch(cb);
            },
            (cb) => {
              // Populate event photos
              let populatedPhotos = [];
              async.each(item.photosId, (photoId, cb1) => {
                kernel.model.Photo.findById(photoId).then(photo => {
                  photoId = (photo && !photo.blocked) ? photo : photoId;
                  populatedPhotos.push(photoId);
                  cb1();
                }).catch(cb1);
              }, () => {
                item.photosId = populatedPhotos;
                cb();
              });
            },
            (cb) => {
              // Populate event banner
              if (item.banner) {
                kernel.model.Photo.findById(item.banner).then(banner => {
                  if (!banner) {
                    return cb();
                  }
                  item.banner = (banner && !banner.blocked) ? banner : item.banner;
                  cb();
                }).catch(cb);
              } else {
                cb();
              }
            }
          ], callback);
        }, (err) => {
          if(err) {
            return _cb(err);
          }
          return _cb(null, result);
        });
      });
    }

    async.waterfall(funcs, (err, query) => {
      if(err) {
        return res.status(500).json({type: 'SERVER_ERROR'}); 
      }
      let cb = (err, data) => {
        if(err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        } 
        if(!locationCheck || radius > 100 || data.items.length >= limit) {
          return res.status(200).json(data); 
        } else {
          radius+=10;
          query.query.filtered.filter.bool.must.push({
            geo_distance: {
              distance: radius + 'km',
              'location.coordinates': [req.body.location.lng, req.body.location.lat], 
            }
          });
          getEvents(query, cb);
        }
      }
      getEvents(query, cb);
    });
  });

  kernel.app.get('/api/v1/events/:id/bestPics/:limit', kernel.middleware.isAuthenticated(), (req, res) => {

    if(!kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST', message: 'Invalid Id'});
    }

    let limit = parseInt(req.params.limit);
    if(!limit || limit === 'NaN' || limit > 10) {
      limit = 1;
    }

    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
       return res.status(404).json({type: 'EVENT_NOT_FOUND', message: 'Event not found'}); 
      }
      async.waterfall([
        (cb) => {
          async.waterfall([
            _cb => {
              kernel.model.Feed.find({
                eventId: event._id,
                blocked: false
              }, (err, feeds) => {
                if(err) return _cb(err);
                let photosId = [];
                _.each(feeds, feed => {
                  photosId = photosId.concat(feed.photosId || []);
                });
                return _cb(null, _.uniq(photosId));
              });
            },

            (photosId, _cb) => {
              if(!photosId.length) {
                return _cb(null, []);
              }
              
              kernel.model.Photo.find({
                _id: { $in: photosId},
                blocked: false
              })
              .sort({createdAt: -1}).limit(limit).exec(_cb);
            }
          ], cb);
        },
        (photos, cb) => {
          if(limit === photos.length) return cb(null, photos);
          let remaining = limit - photos.length;
          let ids = event.photosId;
          if(ids.length > remaining) {
            ids = ids.splice(remaining);
          }
          kernel.model.Photo.find({
            _id: { $in: ids },
            blocked: false
          }, (err, eventPhotos) => {
            if(err) return cb(err);
            return cb(null, photos.concat(eventPhotos));
          });
        }
      ], (err, photos) => {
        if(err) return res.status(500).json({type: 'SERVER_ERROR'});
        return res.status(200).json(photos);
      });
    }).catch(err => res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}));
  });

  /*Ban user from event participants*/
  kernel.app.put('/api/v1/events/:id/banUser', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.userId) {
      return res.status(422).json({message: 'Missing ban user info', type: 'MISSING_BAN_USER'});
    }
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      if (event.ownerId.toString()===req.user._id.toString()) {
        let index = event.participantsId.indexOf(req.body.userId);
        if (index !== -1) {
          event.participantsId.splice(index, 1);
          event.save().then(() => {
            kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
            return res.status(200).end();
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        } else {
          return res.status(404).end();
        }
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  kernel.app.post('/api/v1/events/:id/grantAward', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.userId) {
      return res.status(422).json({message: 'Missing user id'});
    }
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      kernel.model.Award.findById(event.awardId).then(award => {
        if (!award) {
          return res.status(404).end();   
        }
        kernel.model.User.findById(req.body.userId).then(user => {
          if (!user) {
            return res.status(404).end();      
          }
          kernel.model.GrantAward.find({ownerId: user._id, eventId: event._id, awardId: award._id}).then(awards => {
            if (awards.length > 0) {
              return res.status(422).json({message: 'This event award has granted to this user', type: 'AWARD_GRANTED_ERROR'});
            }
            // Insert new award
            kernel.model.GrantAward({
              ownerId: user._id,
              eventId: event._id,
              awardId: award._id
            }).save().then(saved => {
              return res.status(200).end();
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});     
            });
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});     
          });
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});    
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      })
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    })
  });

  /*Attend an event*/
  kernel.app.put('/api/v1/events/:id/attend', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      if (event.private) {
        return res.status(500).json({type: 'SERVER_ERROR', message: 'This event is not public'});
      }
      let availableUser = event.participantsId;
      availableUser.push(event.ownerId);
      // Check if user is already joined or not
      if (availableUser.indexOf(req.user._id) === -1) {
        event.participantsId.push(req.user._id);
        event.stats.totalParticipants = event.participantsId.length;
        event.save().then(saved => {
          kernel.queue.create('GRANT_AWARD_FOR_USER', {event: event, user: req.user}).save();
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: saved}).save();
          kernel.model.AttendEvent({
            ownerId: req.user._id,
            eventId: saved._id
          }).save().then(() => {
            return res.status(200).end();
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});  
          });
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      } else {
        return res.status(409).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    })
  });
};