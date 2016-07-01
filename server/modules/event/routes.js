import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
// import path from 'path';
// import S3 from './../../components/S3';

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
      if (req.body.event.participants && req.body.event.participants.length > 0) {
        data.participantsId = _.map(req.body.event.participants, (participant) => {
          return participant._id;
        });
      }

      if (req.body.event.isRepeat === 'true') {
        var repeatTypes = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!req.body.event.repeat.startDate || !req.body.event.repeat.endDate || !req.body.event.repeat.type) {
          return res.status(422).json({type: 'EVENT_REPEATING_MISSING_ENTITIES', path: 'repeat', message: 'Event repeat is missing some entities'}); 
        }
        if (repeatTypes.indexOf(req.body.event.repeat.type) !== -1) {
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

      async.each(req.files, (file, callback) => {
        var photo = {
          ownerId: req.user._id,
          metadata: {
            tmp: file.path
          }
        };
        let model = new kernel.model.Photo(photo);
        model.save().then(saved => {
          uploadedPhotoIds.push(saved._id);
          callback(null, uploadedPhotoIds);
        }).catch(err => {
          callback(err);
        });
      }, () => {
        data.photosId = uploadedPhotoIds;
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
            return res.status(200).json(event);
          });
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
        
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
    kernel.model.Event.findById(req.params.id)
    .populate('ownerId', '-password -salt')
    .populate('categoryId')
    .populate('awardId')
    //.populate('photosId.metadata')
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

  /*
  Delete an event
  */
  kernel.app.delete('/api/v1/events/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Event.findById(req.params.id).then(event => {
      if (!event) {
       return res.status(404).json({type: 'EVENT_NOT_FOUND', message: 'Event not found'}); 
      }
      if (event.ownerId===req.user._id || req.user.role==='admin') {
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
};