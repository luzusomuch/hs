import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
import moment from 'moment';
import {EventBus} from '../../components';

module.exports = function(kernel) {
	kernel.app.post('/api/v1/events/', kernel.middleware.isAuthenticated(), (req, res) => {
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
      if (!req.body.event.location.fullAddress) {
        return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
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
          uploadedPhotoIds.push(saved._id);
          kernel.queue.create('PROCESS_AWS', saved).save();
          callback(null, uploadedPhotoIds);
        }).catch(err => {
          callback(err);
        });
      }, () => {
        data.photosId = uploadedPhotoIds;
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
    });
  });

  /* suggest for searching */

  kernel.app.get('/api/v1/events/suggest', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!req.query.keyword) {
      return res.status(200).json([]);
    }

    let query = {
      query: {
        match_all: {}
      },
      filter: {
        or: [
          { match_phrase: { title: req.query.keyword } },
          { term: { tag: req.query.keyword } }
        ]
      }
    };
    console.log(JSON.stringify(query));
    //Todo: filter based on query

    kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {

    });

  });

  /*
  Get Event Detail
  */
  kernel.app.get('/api/v1/events/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    if(!kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }
    kernel.model.Event.findById(req.params.id)
    .populate('ownerId', '-password -salt')
    .populate('categoryId')
    .populate('awardId')
    .populate('photosId')
    //.populate('participantsId', '-hashedPassword - salt')
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
      // TODO - Update data
      return res.status(200).json({type: 'EVENT_UPDATE_SUCCESS', message: 'Event updated'});
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /**
  * Get related events
  *
  */

  kernel.app.get('/api/v1/events/:id/related', (req, res) => {
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
              categoryId: event.categoryId,
              createAt: { $lte: event.createAt },
              _id: { $ne: event._id }
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
        event.save().then(() => {
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

    const LIMIT = 6;

    kernel.model.Event.findById(req.params.id).then(
      event => {
        if(!event) {
          return res.status(404);
        }
        let response = {
          total: event.participantsId.length,
          items: []
        };
        async.waterfall([
          (cb) => {
            kernel.model.Relation.find({
              $or: [
                { fromUserId: req.user._id },
                { toUserId: req.user._id },
              ],
              type: 'friend',
              status: 'completed'
            }, (err, friends) => {
              if(err) return cb(err);
              let friendIds = _.map(friends, f => {
                return f.fromUserId.toString() === req.user._id.toString() ? f.toUserId : f.fromUserId;
              });
              return cb(null, friendIds);
            });
          },
          (friendIds, cb) => {
            if(!friendIds.length) return cb(null, []);
            kernel.model.User.find({
              $and: [
                {
                  _id: { $in: event.participantsId }
                },
                {
                  _id: { $in: friendIds}
                }
              ]
            }, '-salt -password').limit(LIMIT).exec((err, friends) => {
              if(err) return cb(err);
              return cb(null, _.map(friends, friend => {
                let user = friend.toJSON();
                user.isFriend = true;
                return user;
              }));
            });
          },
          (friends, cb) => {
            let remainingLimit = LIMIT - friends.length;
            let remainingLength = event.participantsId.length - friends.length;
            if(event.participantsId.indexOf(req.user._id) !== -1 ) remainingLength--;
            if(!remainingLimit || !remainingLength) return cb(null, friends);
            let skip = 0;
            // remainingLimit = 1
            // remainingLength = 7
            if(remainingLimit < remainingLength) {
              let start = 1;
              let end = remainingLength - remainingLimit + 1;
              skip = Math.floor((Math.random() * end) + start) - 1;
            }
            kernel.model.User.find({
              $and: [
                {
                  _id: { $ne: req.user._id }
                },
                {
                  _id: { $in: event.participantsId }
                },
                {
                  _id: { $nin: _.map(friends, '_id') }
                }
              ]
            }, '-salt -password').limit(remainingLimit).skip(skip).exec((err, participants) => {
              if(err) return cb(err);
              return cb(null, friends.concat(participants));
            });
          }
        ], (err, items) => {
          if(err) return res.status(500).json({type: 'SERVER_ERROR'});
          response.items = items;
          return res.status(200).json(response);
        });
      }
    )
    .catch(err => res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}));
  });

  /* Get event */

  kernel.app.post('/api/v1/events/search', kernel.middleware.isAuthenticated(), (req, res) => {
    let query = {
      query: {
        match_all: {}
      }
    };

    //Todo: filter based on query

    kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
      if(err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      async.each(result.items, (item, callback) => {
        item.liked = false;
        async.parallel([
          (cb) => {
            // populate ownerId
            kernel.model.User.findById(item.ownerId, '-password -salt').then(u => {
              if (u) {
                let user = u.toJSON();
                kernel.model.GrantAward.count({ownerId: user._id}).then(count => {
                  user.totalAwards = count;
                  console.log(user);
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
          }
        ], callback);
      }, () => {
        return res.status(200).json(result);
      });
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
                _id: { $in: photosId}
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
            _id: { $in: ids }
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
};