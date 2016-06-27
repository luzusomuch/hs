import Joi from 'joi';
import _ from 'lodash';

module.exports = function(kernel) {
	kernel.app.post('/api/v1/events/', kernel.middleware.isAuthenticated(), (req, res) => {
		if (req.user.deleted && req.user.deleted.status) {
			return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
		}
		if (req.user.blocked && req.user.blocked.status) {
			return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'});	
		}
  	// TODO - storage all uploaded photos to PHOTO SCHEMA and then push its ID to photosId field

    //TODO - validator
    var data = req.body;
    data.ownerId = req.user._id;
    data.organizerId = req.user._id;
    data.public = {status: true};
    data.blocked = {status: false};

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
      startDateTime: Joi.number().required().options({
      	language: {
      		key: 'startDateTime'
      	}
      }),
      endDateTime: Joi.number().required().options({
      	language: {
      		key: 'endDateTime'
      	}
      }),
      awardsId: Joi.array(Joi.string()).min(1).required().options({
      	language: {
      		key: 'awards',
      		string: {
      			min: 'must have at least 1 item'
      		}
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
    	_.each(result.error.details, (error) => {
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
    			case 'string.min':
    				type = 'EVENT_AWARDS_REQUIRED';
    				break;
    			default:
    				break;
    		}
    		errors.push({type: type, path: error.path, message: error.message});
    	});
      return res.status(422).json(errors);
    }
      
    let model = new kernel.model.Event(data);
    model.save().then(event => {
      res.status(200).json(event);
    })
    .catch(err => {
      //TODO - handle error
      res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};