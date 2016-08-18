import Joi from 'joi';
import async from 'async';

module.exports = function(kernel) {
	/*Send message*/
	kernel.app.post('/api/v1/threads', kernel.middleware.isAuthenticated(), (req, res) => {
		var schema = Joi.object().keys({
	        message: Joi.string().required().options({
	          	language: {
	            	key: 'message'
	          	}
	        }),
	        fromUserId: Joi.string().required().options({
	          	language: {
	            	key: 'fromUserId'
	          	}
	        }),
	        toUserId: Joi.string().required().options({
	          	language: {
	            	key: 'toUserId'
	          	}
	        })
      	});
      	var result = Joi.validate(req.body, schema, {
	        stripUnknown: true,
	        abortEarly: false,
	        allowUnknown: true
      	});

      	if (result.error) {
      		return res.status(422).end();
      	}

      	// find out thread between 2 users
      	kernel.model.Thread.findOne({
      		$or: [{
      			fromUserId: req.body.fromUserId, toUserId: req.body.toUserId
      		}, {
      			fromUserId: req.body.toUserId, toUserId: req.body.fromUserId
      		}]
      	}).then(thread => {
      		if (!thread) {
      			// If 2 users haven't got any conversation then create one
      			kernel.model.Thread({
      				fromUserId: req.body.fromUserId,
      				toUserId: req.body.toUserId,
      				messages: [{
      					sentUserId: req.body.fromUserId,
      					message: req.body.message,
      					createdAt: new Date()
      				}]
      			}).save().then(newThread => {
      				return res.status(200).json(newThread);
      			}).catch(err => {
      				return res.status(500).json({type: 'SERVER_ERROR', message: err});
      			});
      		} else {
	      		// If 2 users above already have a conversation then update it
	      		thread.messages.push({
	      			sentUserId: req.body.fromUserId, 
	      			message: req.body.message, createdAt: 
	      			new Date()
	      		});
	      		thread.save().then(saved => {
	      			return res.status(200).json(saved);
	      		}).catch(err => {
	      			return res.status(500).json({type: 'SERVER_ERROR', message: err});	
	      		});
      		}
      	}).catch(err => {
      		return res.status(500).json({type: 'SERVER_ERROR', message: err});
      	});
	});
};