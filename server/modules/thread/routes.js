import Joi from 'joi';
import async from 'async';
import _ from 'lodash';

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

    /*Send new message*/
    kernel.app.post('/api/v1/threads/:id', kernel.middleware.isAuthenticated(), (req, res) => {
        if (!req.body.message || (req.body.message && req.body.message.trim().length===0)) {
            return res.status(422).end();
        }
        kernel.model.Thread.findById(req.params.id).then(thread => {
            if (!thread) {
                return res.status(404).end();
            }
            if (thread.fromUserId.toString()===req.user._id.toString() || thread.toUserId.toString()===req.user._id.toString()) {
                thread.messages.push({
                    sentUserId: req.user._id,
                    createdAt: new Date(),
                    message: req.body.message
                });
                thread.save().then(() => {
                    return res.status(200).json({message: req.body.message, createdAt: new Date()});
                }).catch(err => {
                    return res.status(500).json({type: 'SERVER_ERROR', message: err}); 
                });
            } else {
                return res.status(403).end();
            }
        }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR', message: err}); 
        });
    });

    /*Get my messages*/
    kernel.app.get('/api/v1/threads/my-messages', kernel.middleware.isAuthenticated(), (req, res) => {
        let page = req.query.page || 1;
        let pageSize = req.query.pageSize || 10;
        let skip = pageSize * (page -1);
        kernel.model.Thread.find({
            $or: [{
                fromUserId: req.user._id
            }, {
                toUserId: req.user._id
            }]
        }).populate({
            path: 'messages.sentUserId',
            select: '-password -salt',
            populate: {path: 'avatar', model: 'Photo'}
        })
        .limit(Number(pageSize))
        .skip(skip)
        .sort({updatedAt: -1})
        .exec().then(threads => {
            console.log(threads.length)
            kernel.model.Thread.count({
                $or: [{
                    fromUserId: req.user._id
                }, {
                    toUserId: req.user._id
                }]
            }).then(count => {
                let results = [];
                async.each(threads, (thread, callback) => {
                    thread = thread.toJSON();
                    let id = (thread.fromUserId.toString()===req.user._id.toString()) ? thread.toUserId : thread.fromUserId;
                    kernel.model.User.findById(id, '-password -salt').populate('avatar').exec().then(user => {
                        if (!user) {
                            return callback(null);
                        }
                        user = user.toJSON();
                        user.threadId = thread._id;
                        user.messages = thread.messages;
                        user.threadUpdatedAt = thread.updatedAt;
                        user.lastMessage = _.last(thread.messages);
                        results.push(user);
                        callback(null);
                    }).catch(callback);
                }, (err) => {
                    if (err) {
                        return res.status(500).json({type: 'SERVER_ERROR'});
                    }
                    return res.status(200).json({items: results, totalItem: count});
                });
            }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});    
            });
        }).catch(err => {
            console.log(err);
            return res.status(500).json({type: 'SERVER_ERROR', message: err});
        });
    });

    /*Get thread detail*/
    kernel.app.get('/api/v1/threads/:id', kernel.middleware.isAuthenticated(), (req, res) => {
        kernel.model.Thread.findById(req.params.id)
        .populate('messages.sentUserId', '-password -salt')
        .exec().then(thread => {
            if (!thread) {
                return res.status(404).end();
            }
            if (thread.fromUserId.toString()===req.user._id.toString() || thread.toUserId.toString()===req.user._id.toString()) {
                return res.status(200).json(thread);
            } else {
                return res.status(403).end();
            }

        }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR', message: err});
        });
    });
};