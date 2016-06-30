import Joi from 'joi';
import _ from 'lodash';
import async from 'async';

module.exports = function(kernel) {
	kernel.app.post('/api/v1/events/', kernel.middleware.isAuthenticated(), (req, res) => {
    console.log(req.body);
    console.log(req.body.files);
		if (req.user.deleted && req.user.deleted.status) {
			return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
		}
		if (req.user.blocked && req.user.blocked.status) {
			return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'});	
		}
  	// TODO - storage all uploaded photos to PHOTO SCHEMA and then push its ID to photosId field

    if (!req.body.award) {
      return res.status(422).json({type: 'EVENT_AWARD_REQUIRED', path: 'award', message: 'Award is required'});
    }
    if (!req.body.location.fullAddress) {
      return res.status(422).json({type: 'EVENT_LOCATION_REQUIRED', path: 'location', message: 'Location is required'}); 
    }
    var data = {
      name: req.body.name,
      description: req.body.description,
      categoryId: req.body.categoryId,
      startDateTime: req.body.startDateTime,
      endDateTime: req.body.endDateTime,
      awardId: req.body.award._id
    };
    data.ownerId = req.user._id;
    data.organizerId = req.user._id;
    data.public = req.body.public;
    data.private = !data.public;
    data.location = req.body.location;
    if (req.body.participants && req.body.participants.length > 0) {
      data.participantsId = _.map(req.body.participants, (participant) => {
        return participant._id;
      });
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
    		res.status(200).json(event);
    	});
    }).catch(err => {
      console.log(err);
      res.status(500).json({type: 'SERVER_ERROR'});
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
            /*async.map(evetns, (event) => {
              count comment here
            }, cb);*/
            cb(null, events);
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