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
                    kernel.queue.create('NEW_MESSAGE_IN_THREAD', saved._id).save();
	      			return res.status(200).json(saved);
	      		}).catch(err => {
	      			return res.status(500).json({type: 'SERVER_ERROR', message: err});	
	      		});
      		}
      	}).catch(err => {
      		return res.status(500).json({type: 'SERVER_ERROR', message: err});
      	});
	});

    /*Send message in my message page*/
    kernel.app.post('/api/v1/threads/new-threads', kernel.middleware.isAuthenticated(), (req, res) => {
        if (!req.body.toUsers || !req.body.message || req.body.toUsers instanceof Array === false) {
            return res.status(422).end();
        }
        let results = [];
        async.each(req.body.toUsers, (userId, callback) => {
            kernel.model.User.findById(userId, '-password -salt')
            .populate('avatar')
            .exec().then(user => {
                if (!user) {
                    return callback(null);
                }
                if (user.blocked.status || user.deleted.status) {
                    return callback(null);
                }
                user = user.toJSON();
                kernel.model.Thread.findOne({
                    $or: [{
                        fromUserId: user._id, toUserId: req.user._id
                    }, {
                        fromUserId: req.user._id, toUserId: user._id
                    }]
                }).then(thread => {
                    if (!thread) {
                        kernel.model.Thread({
                            fromUserId: req.user._id,
                            toUserId: user._id,
                            messages: [{
                                sentUserId: req.user._id,
                                message: req.body.message,
                                createdAt: new Date()
                            }]
                        }).save().then(saved => {
                            user.threadId = saved._id;
                            user.threadUpdatedAt = saved.updatedAt;
                            user.lastMessage = {
                                sentUserId: req.user._id,
                                message: req.body.message,
                                createdAt: new Date()
                            };
                            results.push(user);
                            return callback(null);
                        }).catch(callback);
                    } else if (thread.blocked) {
                        return callback(null);
                    } else {
                        thread.messages.push({
                            sentUserId: req.user._id, 
                            message: req.body.message,
                            createdAt: new Date()
                        });
                        thread.save().then(saved => {
                            kernel.queue.create('NEW_MESSAGE_IN_THREAD', saved._id).save();
                            user.threadId = saved._id;
                            user.threadUpdatedAt = saved.updatedAt;
                            user.lastMessage = {
                                sentUserId: req.user._id,
                                message: req.body.message,
                                createdAt: new Date()
                            };
                            results.push(user);
                            return callback(null);
                        }).catch(callback);
                    }
                }).catch(callback);
            }).catch(callback);
        }, (err) => {
            if (err) {
                return res.status(500).json({type: 'SERVER_ERROR'});
            }
            return res.status(200).json({items: results});
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
                    kernel.queue.create('NEW_MESSAGE_IN_THREAD', thread._id).save();
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

    /*Search messages with base on user name or message content*/
    kernel.app.get('/api/v1/threads/search', kernel.middleware.isAuthenticated(), (req, res) => {
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
        }).then(threads => {
            let results = [];
            async.each(threads, (thread, callback) => {
                let id = (thread.fromUserId.toString()===req.user._id.toString()) ? thread.toUserId : thread.fromUserId;
                kernel.model.User.findById(id, '-password -salt').populate('avatar').exec().then(user => {
                    if (!user) {
                        return callback(null);
                    }
                    user = user.toJSON();
                    if (user.name && user.name.toLowerCase().indexOf(req.query.query.toLowerCase()) !== -1) {
                        user.threadId = thread._id;
                        user.messages = thread.messages;
                        user.threadUpdatedAt = thread.updatedAt;
                        user.lastMessage = _.last(thread.messages);
                        results.push(user);
                        callback(null);
                    } else {
                        let index = _.findIndex(thread.messages, (message) => {
                            return message.message && message.message.toLowerCase().indexOf(req.query.query.toLowerCase()) !== -1;
                        });
                        if (index !== -1) {
                            user.threadId = thread._id;
                            user.messages = thread.messages;
                            user.threadUpdatedAt = thread.updatedAt;
                            user.lastMessage = thread.messages[index];
                            results.push(user);
                        }
                        callback(null);
                    }
                }).catch(callback);
            }, (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)});
                }
                return res.status(200).json({items: results});
            });
        }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)});
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
        .populate({
            path: 'messages.sentUserId', select: '-password -salt',
            populate: {
                path: 'avatar', 
                model: 'Photo'
            }
        })
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

    /*Block conversation*/
    kernel.app.put('/api/v1/threads/:id/block', kernel.middleware.isAuthenticated(), (req, res) => {
        kernel.model.Thread.findById(req.params.id).then(thread => {
            if (!thread) {
                return res.status(404).end();
            }
            if ((!thread.blockedByUserId && !thread.blocked) || (thread.blocked && thread.blockedByUserId && thread.blockedByUserId.toString()===req.user._id.toString())) {
                thread.blocked = !thread.blocked;
                thread.blockedByUserId = (thread.blocked) ? req.user._id : null;
                thread.save().then(saved => {
                    return res.status(200).json({blocked: saved.blocked});
                }).catch(err => {
                    console.log(err);
                    return res.status(500).json({type: 'SERVER_ERROR'});        
                });
            } else {
                return res.status(403).end();
            }
        }).catch(err => {
            console.log(err);
            return res.status(500).json({type: 'SERVER_ERROR'});
        });
    });

    /*Receive email when have new post*/
    kernel.app.put('/api/v1/threads/:id/config-receive-email', kernel.middleware.isAuthenticated(), (req, res) => {
        kernel.model.Thread.findById(req.params.id).then(thread => {
            if (!thread) {
                return res.status(404).end();
            }
            thread.nonReceiveEmailUsers = (thread.nonReceiveEmailUsers) ? thread.nonReceiveEmailUsers : [];
            let index = thread.nonReceiveEmailUsers.indexOf(req.user._id);
            if (index !== -1) {
                thread.nonReceiveEmailUsers.splice(index ,1);
            } else {
                thread.nonReceiveEmailUsers.push(req.user._id);
            }
            thread.save().then(saved => {
                return res.status(200).json({nonReceiveEmailUsers: saved.nonReceiveEmailUsers});
            }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});
            });
        }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
        });
    });

    /*Change tags*/
    kernel.app.put('/api/v1/threads/:id/change-tags', kernel.middleware.isAuthenticated(), (req, res) => {
        if (!req.body.tags) {
            return res.status(422).end();
        }
        kernel.model.Thread.findById(req.params.id).then(thread => {
            if (!thread) {
                return res.status(404).end();
            }
            let availableUser = [thread.fromUserId.toString(), thread.toUserId.toString()];
            if (availableUser.indexOf(req.user._id.toString()) !== -1) {
                thread.tags = req.body.tags;
                thread.save().then(saved => {
                    return res.status(200).json({tags: saved.tags});
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