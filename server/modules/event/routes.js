import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
import moment from 'moment';
import momentTz from 'moment-timezone';
import {EventBus} from '../../components';
import { StringHelper } from '../../kernel/helpers';
import { PhotoHelper } from '../../helpers';

module.exports = function(kernel) {
  kernel.app.post('/api/v1/events', kernel.middleware.isAuthenticated(), (req, res) => {
    let bannerName;
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, kernel.config.tmpPhotoFolder)
      },
      filename: (req, file, cb) => {
        if (file.originalname && file.originalname==='blob') {
          bannerName = req.user._id+'_'+ StringHelper.randomString(10) +'_'+file.originalname+'.jpg';
        }
        return cb(null, (bannerName) ? bannerName : file.originalname);
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

      if (req.body.event.limitNumberOfParticipate==='true' && !req.body.event.numberParticipants) {
        return res.status(422).json({type: 'NUMBER_PARTICIPANTS_REQUIRED', path: 'numberParticipants', message: 'Number participants is required'});
      } else if (req.body.event.limitNumberOfParticipate==='true' && (Number(req.body.event.numberParticipants) < 0 || Number(req.body.event.numberParticipants) > 99)) {
        return res.status(422).json({type: 'NUMBER_OF_PARTICIPANTS_IS_BETWEEN_0_99', path: 'numberParticipants', message: 'Number of participants is between 0 and 99'});
      }

      if (req.body.event.costOfEvent==='true' && !req.body.event.amount) {
        return res.status(422).json({path: 'amount', message: 'Event cost amount is required'});
      } else if (req.body.event.costOfEvent==='true' && !req.body.event.currency) {
        return res.status(422).json({path: 'currency', message: 'Event currency is required'});
      }

      kernel.model.Category.findById(req.body.event.categoryId).then(category => {
        if (!category) {
          return res.status(404).end();
        }
        if (category.type!=='action' && !req.body.event.location.fullAddress) {
          return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
        } else if (category.type==='action') {
          req.body.event.location = (req.body.event.location.fullAddress) ? req.body.event.location : {coordinates: [0,0]};
        }

        let data = {
          name: req.body.event.name,
          description: req.body.event.description,
          categoryId: req.body.event.categoryId,
          startDateTime: req.body.event.startDateTime,
          endDateTime: req.body.event.endDateTime,
          awardId: req.body.event.award._id,
          limitNumberOfParticipate: (req.body.event.limitNumberOfParticipate==='true') ? true : false,
          costOfEvent: (req.body.event.costOfEvent==='true') ? true : false,
        };
        data.numberParticipants = (data.limitNumberOfParticipate) ? Number(req.body.event.numberParticipants) - 1 : 0;
        data.minParticipants = (data.limitNumberOfParticipate) ? Number(req.body.event.minParticipants) - 1 : 0;
        data.amount = (data.costOfEvent) ? Number(req.body.event.amount) : 0;
        data.currency = (data.costOfEvent) ? req.body.event.currency : null;
        data.ownerId = req.user._id;
        data.organizerId = req.user._id;
        data.public = (req.body.event.public==='true') ? true : false;
        data.private = !data.public;
        data.location = req.body.event.location;
        data.participantsId = [];

        // apply uploaded photo to current event photos
        if (req.body.event.uploadedPhotoIds) {
          if (req.body.event.uploadedPhotoIds instanceof Array) {
            uploadedPhotoIds = req.body.event.uploadedPhotoIds;
          } else {
            uploadedPhotoIds = [req.body.event.uploadedPhotoIds];
          }
        }
        // check for default picture
        if (req.body.event.defaultPictureId && req.body.event.defaultPictureId!=='default') {
          uploadedPhotoIds.push(req.body.event.defaultPictureId);
        }
        // check for default banner
        if (req.body.event.defaultBannerId) {
          bannerName = req.body.event.defaultBannerId;
          newBannerId = req.body.event.defaultBannerId;
        }

        let participantsId = [];
        if (req.body.event.participants) {
          if (req.body.event.participants._id instanceof Array) {
            participantsId = req.body.event.participants._id;
          } else {
            participantsId = [req.body.event.participants._id];
          }
        } else {
          participantsId = [];
        }

        if (req.body.event.isRepeat === 'true') {
          let repeatTypes = ['daily', 'weekly', 'monthly'];
          if (!req.body.event.repeat.startDate || !req.body.event.repeat.endDate || !req.body.event.repeat.type) {
            return res.status(422).json({type: 'EVENT_REPEATING_MISSING_ENTITIES', path: 'repeat', message: 'Event repeat is missing some entities'}); 
          }
          if (repeatTypes.indexOf(req.body.event.repeat.type) === -1) {
            return res.status(422).json({type: 'EVENT_REPEATING_ENTITY_NOT_VALID', path: 'repeat', message: 'Event repeat entity is not valid'});
          }
          data.repeat = req.body.event.repeat;
        }

        let schema = Joi.object().keys({
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
            if (bannerName && bannerName===file.filename) {
              newBannerId = saved._id;
            } else {
              uploadedPhotoIds.push(saved._id);
            }

            PhotoHelper.UploadOriginPhoto(saved, (err, result) => {
              if (err) {
                return res.status(500).json(err);
              }
              saved.metadata.original = result.s3url;
              saved.keyUrls = {original: result.key};
              saved.markModified('metadata');
              saved.save().then(saved => {
                kernel.queue.create('PROCESS_AWS', saved).save();
                callback(null, uploadedPhotoIds);
              }).catch(err => {
                callback(err);
              });
            });
          }).catch(err => {
            callback(err);
          });
        }, () => {
          data.photosId = uploadedPhotoIds;
          if (bannerName && bannerName.length > 0) {
            data.banner = newBannerId;
          }
          data.stats = {
            totalParticipants: data.participantsId.length
          };
          let model = new kernel.model.Event(data);
          model.save().then(event => {
            // send event invitation request to participants (new request 10/04/2016)
            async.each(participantsId, (userId, callback) => {
              // create notification
              kernel.queue.create('CREATE_NOTIFICATION', {
                ownerId: userId,
                toUserId: userId,
                fromUserId: req.user._id,
                type: 'event-invitation',
                element: event
              }).save();

              kernel.model.InvitationRequest({
                fromUserId: req.user._id,
                toUserId: userId,
                objectId: event._id
              }).save().then(callback).catch(callback);
            }, () => {
              // send email to participants (old request)
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
                async.parallel([
                  (cb) => {
                  // sync data to elasticsearch
                    console.log('start sync data with elasticsearch');
                    kernel.ES.create({type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}, err => {
                      console.log('created ES item');
                      if(err) {
                        console.log(err)
                      }
                      cb();
                    });
                  },
                  (cb) => {
                    // get all user then update real-time count update in home page
                    kernel.model.User.find({}).then(users => {
                      users.forEach(user => {
                        EventBus.emit('socket:emit', {
                          event: 'tracking:count-new-event',
                          room: user._id.toString(),
                          data: event
                        });
                      });
                      cb();
                    }).catch(cb);
                  }
                ], (err) => {
                  if (err) {
                    console.log(err);
                  }

                  // kernel.queue.create(kernel.config.ES.events.CREATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
                  kernel.queue.create('GRANT_AWARD', event).save();
                  kernel.queue.create('TOTAL_EVENT_CREATED', {userId: req.user._id}).save();
                  kernel.model.Event.findById(event._id)
                  .populate('photosId')
                  .populate('categoryId')
                  .exec().then(event => {
                    return res.status(200).json(event);
                  }).catch(err => {
                    return res.status(500).json({type: 'SERVER_ERROR'});
                  });
                });
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

    let eventIds = [];
    let likedEvents = [];

    async.parallel([
      (cb) => {
        if (req.query.getAll) {
          // get all events id which current user liked to show on my calendar
          kernel.model.Like.find({ownerId: req.user._id, objectName: 'Event'}).then(resp => {
            eventIds = _.map(resp, 'objectId');
            if (eventIds.length > 0) {
              kernel.model.Event.find({_id: {$in: eventIds}, blocked: false}).then(resp => {
                likedEvents = resp;
                cb();
              }).catch(cb);
            } else {
              return cb();
            }
          }).catch(cb);
        } else {
          return cb();
        }
      }
    ], () => {
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
                  { term: { participantsId: (req.query.userId) ? req.query.userId : req.user._id}},
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

      kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }

        let results = {items: [], totalItem: result.totalItem};

        if (likedEvents.length > 0) {
          let tmp = [];
          result.items = result.items.concat(likedEvents);
          
          _.each(result.items, item => {
            let dataIndex = _.findIndex(tmp, data => {
              return item._id.toString()===data._id.toString();
            });
            
            if (dataIndex === -1) {
              tmp.push(item);
            }
          })
          result.items = tmp;
        }

        async.each(result.items, (item, callback) => {
          kernel.model.Event.findById(item._id)
          .populate('photosId')
          .populate('categoryId')
          .exec().then(event => {
            if (!event) {
              return callback(null);
            }
            event = event.toJSON();
            // Check if current user is liked this event or not
            kernel.model.Like.findOne({objectId: event._id, objectName: 'Event', ownerId: req.user._id}).then(liked => {
              if (!liked) {
                event.liked = false;
              } else {
                event.liked = true;
              }
              results.items.push(event);
              callback(null);
            }).catch(callback);
          }).catch(callback);
        }, (err) => {
          // check that if user call via my calendar or in user detail
          if (req.query.userId && !req.query.getAll) {
            // check if current user is friend of selected user or current user is the owner of selected user page
            if (req.query.userId.toString()===req.user._id.toString()) {
              // if current user is owner of selected user page
              return res.status(200).json(results);  
            } else {
              // check current user is friend of selected user page
              kernel.model.Relation.findOne({
                $or: [{
                  fromUserId: req.user._id, toUserId: req.query.userId
                }, {
                  fromUserId: req.query.userId, toUserId: req.user._id
                }],
                type: 'friend',
                status: 'completed'
              }).then(relation => {
                console.log(relation);
                if (!relation) {
                  return res.status(200).json({items: [], totalItem: 0});
                }
                return res.status(200).json(results);    
              }).catch(err => {
                return res.status(500).end();
              });
            }
          } else {
            return res.status(200).json(results);
          }
        });
      });
    });
  });

  /*Get my upcoming events*/
  // upcoming meant current user like or participate and the startDateTime of event greater than current time
  kernel.app.get('/api/v1/events/upcoming-event', kernel.middleware.isAuthenticated(), (req, res) => {
    async.parallel([
      (cb) => {
        // get liked events id
        kernel.model.Like.find({objectName: 'Event', ownerId: req.user._id}).then(liked => {
          cb(null, _.map(liked, 'objectId'));
        }).catch(cb);
      },
      (cb) => {
        // get joined events id
        kernel.model.Event.find({
          blocked: false, 
          $or: [{
            participantsId: req.user._id
          }, {
            waitingParticipantIds: req.user._id
          }, {
            ownerId: req.user._id
          }]
        }).then(events => {
          return cb(null, _.map(events, '_id'));
        }).catch(cb);

        // let q = {
        //   query: {
        //     filtered: {
        //       query: {
        //         bool: {
        //           must: [
        //             { term: { blocked: false } }
        //           ],
        //           should: [
        //             { term: { participantsId: req.user._id}},
        //             { term: { ownerId: req.user._id}},
        //           ]
        //         }
        //       },
        //       filter: {
        //         bool: {
        //           must: [],
        //           should: []
        //         }
        //       }
        //     }
        //   }
        // };
        // kernel.ES.search(q, kernel.config.ES.mapping.eventType, (err, result) => {
        //   if (err) {
        //     return cb(err);
        //   }
        //   return cb(null, _.map(result.items, '_id'));
        // });
      }
    ], (err, result) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }

      let page = parseInt(req.query.page);
      let limit = parseInt(req.query.page);
      page = (page === 'NaN' || !page) ? 1 : page;
      limit = (limit === 'NaN' || !limit || limit < 8 || limit > 100) ? 3 : limit;
      let skip = (page - 1) * limit;

      let eventIds = _.union(result[0], result[1]);

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
                must: [
                  {term: {blocked: false}}
                ],
                should: [
                  { terms: { _id: eventIds}}
                ]
              }
            }
          }
        }
      };

      //process dates
      if(req.query.dates instanceof Array && req.query.dates.length) {
        let should = [];
        _.each(req.query.dates, dateString => {
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
          query.query.filtered.filter.bool.must.push({
            bool: {
              should: should
            } 
          });
        }
      }

      //process date
      if(req.query.dates instanceof Array===false) {
        let time = parseInt(req.query.dates);
        let date = moment(new Date(time));
        if(date.isValid()) {
          query.query.filtered.filter.bool.must.push({
            range: {
              startDateTime: {
                gte: date.startOf('date').toISOString(),
                lte: date.endOf('date').toISOString()
              }
            }
          });
        }
      }

      if (!req.query.dates) {
        query.from = skip;
        query.size = limit;
        query.sort = [
          { createdAt: 'desc' }
        ];

        query.query.filtered.filter.bool.must.push({range : { startDateTime: { gte: moment().toISOString() }}});
      }

      kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }

        let results = [];
        async.each(result.items, (item, callback) => {
          async.waterfall([
            (cb) => {
              // Check if current user is liked this event or not
              kernel.model.Like.findOne({objectId: item._id, objectName: 'Event', ownerId: req.user._id}).then(liked => {
                if (!liked) {
                  item.liked = false;
                } else {
                  item.liked = true;
                }
                cb(null, item);
              }).catch(cb);
            },
            (result, cb) => {
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
              let photos = [];
              async.each(result.photosId, (id, callback) => {
                kernel.model.Photo.findById(id).then(photo => {
                  if (!photo) {
                    return callback(null);
                  }
                  if (photo.blocked) {
                    return callback(null);
                  }
                  photos.push(photo);
                  return callback(null, photos);
                }).catch(callback);
              }, err => {
                if (err) {
                  cb(err);
                } else {
                  result.photosId = photos;
                  cb(null, result);
                }
              });
            },
            (result, cb) => {
              kernel.model.User.findById(result.ownerId, '-password -salt')
              .populate('avatar').exec().then(owner => {
                if (!owner) {
                  return cb(null, result);
                }
                owner = owner.toJSON();
                kernel.model.GrantAward.count({ownerId: owner._id, deleted: false}).then(count => {
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
        }, () => {
          return res.status(200).json({items: results, totalItem: result.totalItem});
        });
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
                owner = owner.toJSON();
                kernel.model.GrantAward.count({ownerId: owner._id, deleted: false}).then(count => {
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

  /*Get joined event use for health-book*/
  kernel.app.get('/api/v1/events/joined', kernel.middleware.isAuthenticated(), (req, res) => {
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 10;
    let skip = (page -1) * pageSize;

    let query = {
      query: {
        filtered: {
          filter: {
            bool: {
              must: [{term: {blocked: false}}],
              should: [{
                term: {participantsId: req.user._id}
              }]
            }
          },
          query: {
            bool: {
              should: []
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

    kernel.ES.search(query, kernel.config.ES.mapping.eventType, (err, result) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      let results = [];
      async.each(result.items, (item, callback) => {
        kernel.model.Event.findById(item._id)
        .populate('photosId')
        .populate('banner')
        .populate('categoryId')
        .exec().then(event => {
          if (!event) {
            return callback(null);
          }
          event = event.toJSON();
          async.waterfall([
            (cb) => {
              // check if current user like this event or not
              kernel.model.Like.findOne({objectName: 'Event', objectId: event._id, ownerId: req.user._id}).then(liked => {
                event.liked = (liked) ? true : false;
                cb();
              }).catch(cb);
            }, 
            (cb) => {
              kernel.model.User.findById(item.ownerId, '-password -salt')
              .populate('avatar').exec().then(owner => {
                if (!owner) {
                  return cb(null);
                }
                owner = owner.toJSON();
                kernel.model.GrantAward.count({ownerId: owner._id, deleted: false}).then(count => {
                  owner.totalAwards = count;
                  event.ownerId = owner;
                  cb();
                }).catch(cb);
              }).catch(cb);
            }
          ], (err) => {
            if (err) {
              return callback(null);
            }
            results.push(event);
            callback(null);
          });
        }).catch(callback);
      }, (err) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'}); 
        }
        return res.status(200).json({items: results, totalItem: result.totalItem});
      });
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
    .populate({
      path: 'ownerId', select: '-password -salt',
      populate: {path: 'avatar', model: 'Photo'}
    })
    .populate({
      path: 'adminId', select: '-password -salt',
      populate: {path: 'avatar', model: 'Photo'}
    })
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

      if (event.ownerId.toString()===req.user._id.toString() || req.user.role==='admin' || event.adminId.toString()===req.user._id.toString()) {
        let bannerName;
        let storage = multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, kernel.config.tmpPhotoFolder)
          },
          filename: (req, file, cb) => {
            if (file.originalname && file.originalname==='blob') {
              bannerName = req.user._id+'_'+ StringHelper.randomString(10) +'_'+file.originalname+'.jpg';
            }
            return cb(null, (bannerName && bannerName.length > 0) ? bannerName : file.originalname);
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

          // check limit number of participate
          if (req.body.event.limitNumberOfParticipate==='true' && !req.body.event.numberParticipants) {
            return res.status(422).json({type: 'NUMBER_PARTICIPANTS_REQUIRED', path: 'numberParticipants', message: 'Number participants is required'});
          } else if (req.body.event.limitNumberOfParticipate==='true' && (Number(req.body.event.numberParticipants) < 0 || Number(req.body.event.numberParticipants) > 99)) {
            return res.status(422).json({type: 'NUMBER_OF_PARTICIPANTS_IS_BETWEEN_0_99', path: 'numberParticipants', message: 'Number of participants is between 0 and 99'});
          }

          if (req.body.event.costOfEvent==='true' && !req.body.event.amount) {
            return res.status(422).json({path: 'amount', message: 'Event cost amount is required'});
          } else if (req.body.event.costOfEvent==='true' && !req.body.event.currency) {
            return res.status(422).json({path: 'currency', message: 'Event currency is required'});
          }

          kernel.model.Category.findById(req.body.event.categoryId).then(category => {
            if (!category) {
              return res.status(404).end();
            }
            if (category.type!=='action' && !req.body.event.location.fullAddress) {
              return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
            } else if (category.type==='action') {
              req.body.event.location = (req.body.event.location.fullAddress) ? req.body.event.location : {coordinates: [0,0], type: 'Point'};
            }

            // convert location coordinate to array of number
            req.body.event.location.coordinates = [Number(req.body.event.location.coordinates[0]), Number(req.body.event.location.coordinates[1])];

            // set flag for send email notification when location/timing change
            var sendNotification = false;
            if (JSON.stringify(event.location.coordinates) !== JSON.stringify(req.body.event.location.coordinates) || !moment(moment(event.startDateTime).format('YYYY-MM-DD')).isSame(moment(req.body.event.startDateTime).format('YYYY-MM-DD')) || !moment(moment(event.endDateTime).format('YYYY-MM-DD')).isSame(moment(req.body.event.endDateTime).format('YYYY-MM-DD'))) {
              sendNotification = true;
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
                if (bannerName && bannerName===file.filename) {
                  newBannerId = saved._id;
                } else {
                  event.photosId.push(saved._id);
                }

                PhotoHelper.UploadOriginPhoto(saved, (err, result) => {
                  if (err) {
                    return res.status(500).json(err);
                  }
                  saved.metadata.original = result.s3url;
                  saved.keyUrls = {original: result.key};

                  saved.markModified('metadata');
                  saved.save().then(saved => {
                    kernel.queue.create('PROCESS_AWS', saved).save();
                    callback(null);
                  }).catch(err => {
                    callback(err);
                  });
                });
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
              event.limitNumberOfParticipate = (req.body.event.limitNumberOfParticipate==='true') ? true : false;
              event.numberParticipants = (event.limitNumberOfParticipate) ? Number(req.body.event.numberParticipants) : 0;
              event.minParticipants = (event.limitNumberOfParticipate) ? Number(req.body.event.minParticipants) : 0;
              event.costOfEvent = (req.body.event.costOfEvent==='true') ? true : false;
              event.amount = (event.costOfEvent) ? Number(req.body.event.amount) : 0;
              event.currency = (event.costOfEvent) ? req.body.event.currency : null;

              if (bannerName && bannerName.length > 0) {
                event.banner = newBannerId;
              }
              // Old request

              // if (req.body.event.participants) {
              //   if (req.body.event.participants._id instanceof Array) {
              //     event.participantsId = _.union(event.participantsId, req.body.event.participants._id);
              //   } else {
              //     event.participantsId.push(req.body.event.participants._id);
              //   }
              // } else {
              //   event.participantsId = [];
              // }
              // // get unique participants
              // event.participantsId = _.map(_.groupBy(event.participantsId, (doc) => {
              //   return doc;
              // }), (grouped) => {
              //   return grouped[0];
              // });

              // New request
              let participants = [];
              if (req.body.event.participants) {
                if (req.body.event.participants._id instanceof Array) {
                  participants = req.body.event.participants._id;
                } else {
                  participants.push(req.body.event.participants._id);
                }
              }

              let newParticipantIds = [];
              _.each(participants, (id) => {
                let idx = _.findIndex(event.participantsId, (participantId) => {
                  return id.toString()===participantId.toString();
                });
                if (idx === -1) {
                  newParticipantIds.push(id);
                }
              });
              if (participants.length < event.participantsId.length) {
                event.participantsId = participants;
              }

              // check limit number of participate which current total participants length
              if (req.body.event.limitNumberOfParticipate==='true' && Number(req.body.event.numberParticipants) < event.participantsId.length) {
                return res.status(422).json({type: 'NUMBER_OF_LIMIT_PARTICIPANTS_MUST_GREATOR_THAN_TOTAL_PARTICIPANTS', path: 'numberParticipants', message: 'Number of limit participants must greater than total participants'});
              }

              // check waiting list with limit participants
              if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0 && event.limitNumberOfParticipate && event.numberParticipants > event.participantsId.length) {
                let newWaitingList = _.clone(event.waitingParticipantIds);
                _.each(event.waitingParticipantIds, (id) => {
                  // check if event participants is isqual total number of participant
                  if (event.participantsId.length===event.numberParticipants) {
                    return false;
                  }

                  event.participantsId.push(id);
                  // find out the user has been added to participants list
                  let idx = newWaitingList.indexOf(id);
                  if (idx !== -1) {
                    newWaitingList.splice(idx, 1);
                  }
                });

                // apply new waiting list to the old one
                event.waitingParticipantIds = newWaitingList;
              }

              // if event update limit number of participate to false then push every user in waiting list to participants
              if (!event.limitNumberOfParticipate && event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
                _.each(event.waitingParticipantIds, (id) => {
                  event.participantsId.push(id);
                });
                event.waitingParticipantIds = [];
              }

              // unique event participants
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
                async.each(newParticipantIds, (userId, callback) => {
                  // create notification
                  kernel.queue.create('CREATE_NOTIFICATION', {
                    ownerId: userId,
                    toUserId: userId,
                    fromUserId: req.user._id,
                    type: 'event-invitation',
                    element: event
                  }).save();
                  
                  kernel.model.InvitationRequest({
                    fromUserId: req.user._id,
                    toUserId: userId,
                    objectId: event._id
                  }).save().then(callback).catch(callback);
                }, () => {
                  kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
                  // send email to participants/waiting list/ liked event when location or timing change
                  if (sendNotification) {
                    let owner, ownerAvatar, eventThumbnail;
                    async.waterfall([
                      cb => {
                        // get owner detail
                        kernel.model.User.findById(event.ownerId).populate('avatar').exec().then(user => {
                          if (!user) {
                            return cb('owner not found');
                          }
                          owner = user;
                          ownerAvatar = PhotoHelper.getUserAvatar(user);
                          return cb();
                        }).catch(cb);
                      },
                      (cb) => {
                        // get event thumbnail
                        kernel.model.Event.findById(event._id)
                        .populate('categoryId')
                        .populate('photosId')
                        .exec().then(populatedEvent => {
                          if (!populatedEvent) {
                            return cb('event not found');
                          }
                          eventThumbnail = PhotoHelper.getEventThumbnail(populatedEvent);
                          return cb();
                        }).catch(cb);
                      },
                      (cb) => {
                        //get liked users
                        kernel.model.Like.find({objectId: event._id}).then(likedPeople => {
                          return cb(null, _.map(likedPeople, item => {
                            return item.ownerId;
                          }));
                        }).catch(cb);
                      },
                      (usersId, cb) => {
                        if (!usersId) {
                          return cb();
                        }
                        // join participants and waiting list
                        let eventUsersId = _.union(event.participantsId, event.waitingParticipantIds);
                        // return uniq value
                        _.each(eventUsersId, id => {
                          if (usersId.indexOf(id) === -1) {
                            usersId.push(id);
                          }
                        });
                        async.each(usersId, (id, callback) => {
                          kernel.model.User.findById(id).populate('avatar').exec().then(user => {
                            if (!user) {
                              return callback();
                            }
                            // set avatar for user
                            let userAvatar = PhotoHelper.getUserAvatar(user);

                            // send mail to user
                            kernel.queue.create('SEND_MAIL', {
                              template: 'event-location-or-timing-updated.html',
                              subject: 'Event ' + event.name + ' was updated',
                              data: {
                                user: user, 
                                userAvatar: userAvatar,
                                owner: owner,
                                ownerAvatar: ownerAvatar,
                                eventThumbnail: eventThumbnail,
                                event: event,
                                eventDateTime: moment(new Date(event.endDateTime)).format('DD/MM/YYY') + ' at ' + moment(new Date(event.endDateTime)).format('HH:mm'),
                                url: kernel.config.baseUrl + 'event/detail/' + event._id,
                                language: user.language || 'en'
                              },
                              to: user.email
                            }).save();
                            return callback();
                          }).catch(callback);
                        }, cb);
                      }
                    ], () => {
                      return res.status(200).json({type: 'EVENT_UPDATE_SUCCESS', message: 'Event updated'});
                    });
                  } else {
                    return res.status(200).json({type: 'EVENT_UPDATE_SUCCESS', message: 'Event updated'});
                  }
                });
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
          return res.status(404).json({type: 'EVENT_NOT_FOUND'});
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
            .populate('categoryId')
            .populate('photosId')
            .sort({ createdAt: -1 })
            .limit(5)
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

  // get waiting participants of an event
  kernel.app.get('/api/v1/events/:id/waiting-participants', kernel.middleware.isAuthenticated(), (req, res) => {
    let pageSize = req.query.pageSize || 6;
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      let data = {
        totalItem: (event.waitingParticipantIds) ? event.waitingParticipantIds.length : 0,
        items: []
      };
      let ids = [];
      if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
        _.each(event.waitingParticipantIds, (id, index) => {
          if (index < pageSize) {
            ids.push(id);
          }
        });
      }
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
              data.items.push(user);
              return callback(null);
            }
            user.friendStatus = relation.status;
            data.items.push(user);
            callback(null);
          }).catch(callback);
        }, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }
          return res.status(200).json(data);
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    })
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
        totalItem: event.participantsId.length+1,
        items: []
      };
      let ids = [event.ownerId];
      _.each(event.participantsId, (id, index) => {
        if (index < pageSize) {
          ids.push(id);
        }
      });
      kernel.model.User.find({_id: {$in: ids}}, '-password -salt').populate('avatar').exec().then(users => {
        async.each(users, (user, callback) => {
          user = user.toJSON();
          if (event.adminId && user._id.toString()===event.adminId.toString()) {
            user.isEventAdmin = true;
          }
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
            if (user._id.toString()===event.ownerId.toString()) {
              user.eventOwner = true;
            }
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
    limit = (limit === 'NaN' || !limit || limit < 10 || limit > 100) ? 10 : limit;
    let skip = (page - 1) * limit;

    let term = [];
    let must = [];
    if (!req.body.backend) {
      term = [
        { missing: { field: 'private' } },
        { term: { private: false } },
        { term: { participantsId: req.user._id } },
        { term: { ownerId: req.user._id} }
      ];
      must = [
        { term: { blocked: false } },
        { term: { type: 'local' } }
      ];
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
        // let date = moment(new Date(time));
        let date = momentTz.tz(new Date(time), 'Europe/Berlin');

        if(date.isValid()) {
          should.push({
            range: {
              startDateTime: {
                gte: date.startOf('date').format(),
                lte: date.endOf('date').format()
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
      let date = momentTz.tz(new Date(time), 'Europe/Berlin');
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

    // handle to don't show events which end date smaller than current date
    // only handle when user don't search for dates req.body.dates is empty
    if (req.body.dates instanceof Array && req.body.dates.length===0) {
      let date = momentTz.tz(new Date(), 'Europe/Berlin');
      q.query.filtered.filter.bool.must.push({
        range: {
          endDateTime: {
            gte: date.toISOString()
          }
        }
      });
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

    //process friend activities or company account events 
    let funcs = [];
    if(req.body.friendActivities || req.body.companyAccountEvents) {
      let getFriends =  (cb) => {
        async.waterfall([
          (callback) => {
            if (req.body.friendActivities) {
              kernel.model.Relation.find({
                type: 'friend', 
                status: 'completed', 
                $or: [{fromUserId: req.user._id}, {toUserId: req.user._id}]
              }).then(friends => {
                if (friends.length === 0) {
                  return callback(null, []);
                }
                let friendIds = _.map(friends, (friend) => {
                  return friend.fromUserId.toString() === req.user._id.toString() ? friend.toUserId : friend.fromUserId;
                });
                return callback(null, friendIds);
              }, callback);
            } else {
              callback(null, []);
            }
          }, 
          (userIds, callback) => {
            if (req.body.companyAccountEvents) {
              kernel.model.User.find({isCompanyAccount: true}).then(users => {
                if (users.length===0) {
                  return callback(null, userIds);
                }
                let companyAccountIds = _.map(users, (user) => {
                  return user._id;
                });
                companyAccountIds = _.union(companyAccountIds, userIds);
                return callback(null, companyAccountIds);
              }, callback);
            } else {
              callback(null, userIds);
            }
          }
        ], cb);
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
                  if (photo && !photo.blocked) {
                    populatedPhotos.push(photo);
                  }
                  // photoId = (photo && !photo.blocked) ? photo : photoId;
                  // populatedPhotos.push(photoId);
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
        return res.status(500).json(err); 
      }
      let cb = (err, data) => {
        if(err) {
          return res.status(500).json(err);
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

  /*sync with google or facebook calendar*/
  kernel.app.post('/api/v1/events/sync-events', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.type) {
      return res.status(422).end();
    }
    // We need to find out all events have type equal to req.body.type and ownerId is the same as eventOwnerId
    kernel.model.Event.find({ownerId: req.user._id, type: req.body.type}).then(events => {
      let count = 0;
      async.each(events, (event, callback) => {
        event.remove().then(() => {
          // remove this event in ES
          kernel.queue.create(kernel.config.ES.events.REMOVE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString()}).save();
          count += 1;
          return callback();
        }).catch(callback);
      }, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        async.parallel([
          (cb) => {
            // update count total events for current user
            req.user.stats.totalCreatedEvent -= count;
            req.user.save(cb);
          },
          (cb) => {
            // find out all categories
            kernel.model.Category.find({}, cb);
          },
          (cb) => {
            // find out all default awards
            let defaultAwards = ['Foodstar Point', 'Sportstar Point', 'Socialstar Point', 'Actionstar Point', 'Ecostar Point'];
            kernel.model.Award.find({objectName: {$in: defaultAwards}}, cb);
          }
        ], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({type: 'SERVER_ERROR'});
          }
          // find out the social category
          let selectedCategory;
          let categoryIdx = _.findIndex(result[1], (category) => {
            return category.type==='social';
          });
          if (categoryIdx !== -1) {
            selectedCategory = result[1][categoryIdx];
          } else {
            return res.status(404).json({type: 'CATEGORY_NOT_FOUND', message: 'Category not found'});
          }

          // find out the social award point
          // let selectedAward;
          // let awardIdx = _.findIndex(result[2], (award) => {
          //   return award.objectName==='Socialstar Point';
          // });
          // if (awardIdx !== -1) {
          //   selectedAward = result[2][awardIdx];
          // } else {
          //   return res.status(404).json({type: 'AWARD_NOT_FOUND', message: 'Award not found'});
          // }

          // Insert all events again
          let results = [];
          async.each(req.body.events, (event, callback) => {
            let newEvent;
            if (req.body.type==='facebook') {
              let eventLocation = (event.place) ? event.place.location : {};
              let location = {};
              if (eventLocation && eventLocation.longitude && eventLocation.latitude) {
                location.coordinates = [eventLocation.longitude, eventLocation.latitude];
                location.country = eventLocation.country;
                location.fullAddress = eventLocation.street;
              } else {
                location.coordinates = [0, 0];
              }
              newEvent = {
                ownerId: req.user._id,
                name: event.name,
                description: event.description,
                categoryId: selectedCategory._id,
                // awardId: selectedAward._id,
                startDateTime: event.start_time,
                endDateTime: (event.end_time) ? event.end_time : event.start_time,
                public: false,
                private: true,
                type: req.body.type,
                location: location,
                facebook: event
              };
            } else if (req.body.type==='google') {
              newEvent = {
                ownerId: req.user._id,
                name: event.summary,
                description: event.description,
                categoryId: selectedCategory._id,
                // awardId: selectedAward._id,
                startDateTime: event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date),
                endDateTime: event.end.dateTime ? new Date(event.end.dateTime) :  new Date(event.end.date),
                public: false,
                private: true,
                type: req.body.type,
                location: {
                  coordinates: [0, 0],
                  fullAddress: event.location
                },
                google: event
              }
            }
            kernel.model.Event(newEvent).save().then(saved => {
              results.push(saved);
              kernel.queue.create(kernel.config.ES.events.CREATE, {type: kernel.config.ES.mapping.eventType, id: saved._id.toString(), data: saved}).save();
              kernel.queue.create('TOTAL_EVENT_CREATED', {userId: req.user._id}).save();
              return callback();
            }).catch(callback);
          }, (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({type: 'SERVER_ERROR'});
            }
            return res.status(200).end();
          });
        });
      });
    }).catch(err => {
      console.log(err);
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
  
  /*Get best pictures of an event*/
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
      if (event.ownerId.toString()===req.user._id.toString() || event.adminId.toString()===req.user._id.toString()) {
        let index = event.participantsId.indexOf(req.body.userId);
        if (index !== -1) {
          event.participantsId.splice(index, 1);
          let newAttendUserIds = [];

          // when waiting list having people then add them to participants list
          if (event.limitNumberOfParticipate && event.numberParticipants > 0 && event.participantsId.length < event.numberParticipants) {
            if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
              let newWaitingList = _.clone(event.waitingParticipantIds);
              _.each(event.waitingParticipantIds, (id) => {
                event.participantsId.push(id);

                // find out the user has been added to participants list
                let idx = newWaitingList.indexOf(id);
                if (idx !== -1) {
                  newAttendUserIds.push(id);
                  newWaitingList.splice(idx, 1);
                }

                // check if event participants is isqual total number of participant
                if (event.participantsId.length===event.numberParticipants) {
                  return false;
                }
              });

              // apply new waiting list to the old one
              event.waitingParticipantIds = newWaitingList;
            }
          }

          event.save().then(event => {
            async.each(newAttendUserIds, (userId, callback) => {
              kernel.model.AttendEvent({
                ownerId: userId,
                eventId: event._id
              }).save().then(callback).catch(callback);
            }, () => {
              kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: event}).save();
              return res.status(200).end();
            })
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
      // check event if it have limitation of participants and participants greater than min participant
      if (event.limitNumberOfParticipate && event.participantsId.length < event.minParticipants) {
        return res.status(400).json({type: 'BAD_REQUEST'});
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

  kernel.app.put('/api/v1/events/:id/leave', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      let index = _.findIndex(event.participantsId, (id) => {
        return id.toString()===req.user._id.toString();
      });
      if (index!==-1) {
        event.participantsId.splice(index, 1);
        // when waiting list having people then add them to participants list
        if (event.limitNumberOfParticipate && event.numberParticipants > 0 && event.participantsId.length < event.numberParticipants) {
          if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
            let newWaitingList = _.clone(event.waitingParticipantIds);
            _.each(event.waitingParticipantIds, (id) => {
              event.participantsId.push(id);

              // find out the user has been added to participants list
              let idx = newWaitingList.indexOf(id);
              if (idx !== -1) {
                newWaitingList.splice(idx, 1);
              }

              // check if event participants is isqual total number of participant
              if (event.participantsId.length===event.numberParticipants) {
                return false;
              }
            });

            // apply new waiting list to the old one
            event.waitingParticipantIds = newWaitingList;
          }
        }
          
        event.stats.totalParticipants = event.participantsId.length;

        // if current leave user is admin of event then update adminId to null
        if (event.adminId && event.adminId.toString()===req.user._id.toString()) {
          event.adminId = null;
        }

        event.save().then(saved => {
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: saved}).save();
          return res.status(200).end();
        }).catch(err => {
          return res.status(500).end();
        })
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
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

      // when total parcipants has reached the top then check waiting list
      if (event.participantsId.length >= event.numberParticipants && event.waitingParticipantIds.indexOf(req.user._id) !== -1) {
        return res.status(200).json({isParticipant: false});
      }

      let availableUser = _.clone(event.participantsId);
      availableUser.push(event.ownerId);
      // Check if user is already joined or not
      if (availableUser.indexOf(req.user._id) === -1) {
        if (event.limitNumberOfParticipate && event.numberParticipants > 0 && event.participantsId.length >= event.numberParticipants) {
          if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
            event.waitingParticipantIds.push(req.user._id);
          } else {
            event.waitingParticipantIds = [req.user._id];
          }
        } else {
          event.participantsId.push(req.user._id);
          event.stats.totalParticipants = event.participantsId.length;
        }
        // add current user to attended ids list
        if (event.attendedIds) {
          event.attendedIds.push(req.user._id);
        } else {
          event.attendedIds = [req.user._id]
        }

        event.save().then(saved => {
          kernel.queue.create('GRANT_AWARD_FOR_USER', {event: event, user: req.user}).save();
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: saved}).save();

          // create new notification
          kernel.queue.create('CREATE_NOTIFICATION', {
            ownerId: saved.ownerId,
            toUserId: saved.ownerId,
            fromUserId: req.user._id,
            type: 'attend-event',
            element: saved
          }).save();

          if (event.participantsId.indexOf(req.user._id) !== -1) {
            // if current user has added to participants list
            kernel.model.AttendEvent({
              ownerId: req.user._id,
              eventId: saved._id
            }).save().then(() => {
              return res.status(200).json({isParticipant: true});
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});  
            });
          } else {
            // if user has added to waiting list
            return res.status(200).json({isParticipant: false});
          }
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

  // pass admin role to an event
  kernel.app.put('/api/v1/events/:id/pass-admin-role', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.adminId) {
      return res.status(422).json({message: 'Missing entity'});
    }
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      if (event.ownerId.toString()===req.user._id.toString() || (event.adminId && event.adminId.toString()===req.user._id.toString())) {
        let availableUsers = _.union(event.participantsId, event.waitingParticipantIds);

        let index = _.findIndex(availableUsers, userId => {
          return userId.toString()===req.body.adminId.toString();
        });

        if (index !== -1) {
          event.adminId = req.body.adminId;
          event.passedDate = new Date();
          event.save().then(saved => {
            kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: saved}).save();

            // create new notification
            kernel.queue.create('CREATE_NOTIFICATION', {
              ownerId: saved.adminId,
              toUserId: saved.adminId,
              fromUserId: req.user._id,
              type: 'pass-admin-role',
              element: saved
            }).save();

            // send email to new event admin
            let ownerAvatar, userAvatar, eventThumbnail;
            async.parallel([
              cb => {
                //get the new admin user object
                kernel.model.User.findById(saved.adminId).populate('avatar').exec().then(user => {
                  if (!user) {
                    return cb('Admin user object not found');
                  }
                  userAvatar = PhotoHelper.getUserAvatar(user);
                  cb(null, user);
                }).catch(cb);
              },
              cb => {
                // get owner avatar
                kernel.model.User.findById(req.user._id).populate('avatar').exec().then(owner => {
                  if (!owner) {
                    return cb('Owner not found');
                  }
                  ownerAvatar = PhotoHelper.getUserAvatar(owner);
                  return cb();
                }).catch(cb);
              },
              cb => {
                // get event thumbnail
                kernel.model.Event.findById(event._id)
                .populate('categoryId')
                .populate('photosId')
                .exec().then(populatedEvent => {
                  if (!populatedEvent) {
                    return cb('Event not found');
                  }
                  eventThumbnail = PhotoHelper.getEventThumbnail(populatedEvent);
                  return cb();
                }).catch(cb);
              }
            ], (err, result) => {
              if (err) {
                return res.status(500).end();
              }

              // send email to new admin
              kernel.queue.create('SEND_MAIL', {
                template: 'admin-passed-role.html',
                subject: 'Admin role in event '+saved.name+' has passed to you',
                data: {
                  owner: req.user, 
                  ownerAvatar: ownerAvatar,
                  user: result[0],
                  userAvatar: userAvatar,
                  event: saved,
                  eventThumbnail: eventThumbnail,
                  eventDateTime: moment(new Date(saved.endDateTime)).format('DD/MM/YYY') + ' at ' + moment(new Date(saved.endDateTime)).format('HH:mm'),
                  url: kernel.config.baseUrl + 'event/detail/' + saved._id,
                  language: result[0].language || 'en'
                },
                to: result[0].email
              }).save();

              return res.status(200).end();
            });
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        } else {
          return res.status(409).end();
        }
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    })
  });

  // get all users of event with avatar to pass admin role
  kernel.app.get('/api/v1/events/:id/all-users-of-event', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      if (event.ownerId.toString()===req.user._id.toString() || (event.adminId && event.adminId.toString()===req.user._id.toString())) {
        let allUsers = _.union(event.participantsId, event.waitingParticipantIds);
        let data = [];
        async.each(allUsers, (id, callback) => {
          kernel.model.User.findById(id, '-password -salt')
          .populate('avatar').exec().then(user => {
            if (event.adminId && event.adminId.toString()===user._id.toString()) {
              user = user.toJSON();
              user.isEventAdmin = true;
            }
            data.push(user);
            callback();
          }).catch(callback);
        }, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }
          return res.status(200).json({users: data});
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  // when decline whole repeating event we will push that user id to usersDeclineRepeatingEvent field
  kernel.app.put('/api/v1/events/:id/decline-whole-repeating-event', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
        return res.status(404).end();
      }
      if (event.parentId) {
        kernel.model.Event.findById(event.parentId).then(parentEvent => {
          if (!parentEvent) {
            return res.status(404).end();     
          }
          let usersDeclineRepeatingEvent = (parentEvent.usersDeclineRepeatingEvent) ? parentEvent.usersDeclineRepeatingEvent : [];
          let index = _.findIndex(usersDeclineRepeatingEvent, id => {
            return id.toString()===req.user._id.toString();
          });

          if (index === -1) {
            usersDeclineRepeatingEvent.push(req.user._id);
            parentEvent.usersDeclineRepeatingEvent = usersDeclineRepeatingEvent;
            parentEvent.save().then(saved => {
              kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: event._id.toString(), data: saved}).save();
              return res.status(200).end();
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});    
            });
          } else {
            return res.status(200).end();
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      } else {
        return res.status(403).end();
      }
    }).catch(() => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};