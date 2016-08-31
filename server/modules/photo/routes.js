import Joi from 'joi';
import async from 'async';
import _ from 'lodash';

module.exports = function(kernel) {

	/*Get all photos restrict admin*/
	kernel.app.get('/api/v1/photos', kernel.middleware.hasRole('admin'), (req, res) => {
		let page = req.query.page || 1;
		let pageSize = req.query.pageSize || 10;
		kernel.model.Photo.find({blocked: false})
	    .limit(Number(pageSize))
	    .skip(pageSize * (page-1))
	    .populate('ownerId', '-password -salt')
	    .exec().then(photos => {
    		let results = [];
	    	// get photo's project info
	    	async.each(photos, (photo, callback) => {
	    		async.waterfall([
	    			(cb) => {
	    				kernel.model.Feed.findOne({photosId: photo._id}).then(feed => {
	    					if (!feed) {
	    						cb(null, {eventId: null});
	    					} else {
	    						cb(null, {eventId: feed.eventId});
	    					}
	    				}).catch(cb);
	    			},
	    			(result, cb) => {
	    				if (result.eventId) {
	    					cb(null, result);
	    				} else {
	    					kernel.model.Event.findOne({photosId: photo._id}).then(event => {
	    						if (!event) {
	    							cb({error: 'Event not found', code: 404});
	    						} else {
	    							cb(null, {eventId: event._id});
	    						}
	    					}).catch(cb);
	    				}
	    			}
	  			], (err, result) => {
	  				photo = photo.toJSON();
	  				if (err) {
	  					photo.event = null;
	  					results.push(photo);
	  					callback();
	  				} else {
		  				kernel.model.Event.findById(result.eventId).then(event => {
		  					photo.event = event;
		  					results.push(photo);
		  					callback();
		  				}).catch(err => {
		  					callback(err);
		  				});
	  				}
	  			});
	    	}, (err) => {
	    		if (err) {
	    			return res.status(500).json({type: 'SERVER_ERROR'});
	    		}
		      	kernel.model.Photo.count({blocked: false}).then(count => {
		      		return res.status(200).json({items: results, totalItem: count});
		      	}).catch(err => {
		      		return res.status(500).json({type: 'SERVER_ERROR'});	
		      	});
	    	});
	    }).catch(err => {
	      	return res.status(500).json({type: 'SERVER_ERROR'});
	    });
	});

	/*Search photos*/
	kernel.app.get('/api/v1/photos/search', kernel.middleware.hasRole('admin'), (req, res) => {
		kernel.model.Photo.find({
			blocked: (req.query.blocked) ? true : false
		})
	    .populate('ownerId', '-password -salt')
	    .exec().then(photos => {
    		let results = [];
	    	// get photo's project info
	    	async.each(photos, (photo, callback) => {
	    		async.waterfall([
	    			(cb) => {
	    				kernel.model.Feed.findOne({photosId: photo._id}).then(feed => {
	    					if (!feed) {
	    						cb(null, {eventId: null});
	    					} else {
	    						cb(null, {eventId: feed.eventId});
	    					}
	    				}).catch(cb);
	    			},
	    			(result, cb) => {
	    				if (result.eventId) {
	    					return cb(null, result);
	    				} 
	    				kernel.model.Event.findOne({photosId: photo._id}).then(event => {
    						if (!event) {
    							return cb({error: 'Event not found', code: 404});
    						} else {
    							return cb(null, {eventId: event._id});
    						}
    					}).catch(cb);
	    			}
	  			], (err, result) => {
	  				photo = photo.toJSON();
	  				if (err) {
	  					photo.event = null;
	  					results.push(photo);
	  					return callback(null);
	  				}
	  				kernel.model.Event.findById(result.eventId).then(event => {
	  					photo.event = event;
	  					results.push(photo);
	  					return callback(null);
	  				}).catch(callback);
	  			});
	    	}, (err) => {
	    		if (err) {
	    			return res.status(500).json({type: 'SERVER_ERROR'});
	    		}
	    		let items = [];
	    		// Filter to client request
	    		if (req.query.type && req.query.searchQuery) {
	    			_.each(results, (item) => {
	    				if (req.query.type==='ownerId.name') {
	    					if (item.ownerId.name.toLowerCase().indexOf(req.query.searchQuery.toLowerCase()) !== -1) {
	    						items.push(item);
	    					}
	    				} else if (req.query.type==='event.name') {
	    					if (item.event && item.event.name.toLowerCase().indexOf(req.query.searchQuery.toLowerCase()) !== -1) {
	    						items.push(item);
	    					}
	    				}
	    			});
	    		} else {
	    			items = results;
	    		}

	      		return res.status(200).json({items: items});
	    	});
	    }).catch(err => {
	      	return res.status(500).json({type: 'SERVER_ERROR'});
	    });
	});

	kernel.app.get('/api/v1/photos/view',kernel.middleware.isAuthenticated(), (req, res) => {
		if(!req.query.id || !kernel.mongoose.Types.ObjectId.isValid(req.query.id)) {
			return res.status(400).json({type: 'BAD_REQUEST', message: 'Invalid Id'});
		}
		async.parallel({
			photo: (cb) => {
				return kernel.model.Photo.findById(req.query.id).populate('ownerId').exec(cb);
			},
			belongTo: (cb) => {
				if(!req.query.tid || !kernel.mongoose.Types.ObjectId.isValid(req.query.tid)) {
					return cb(null);
				}
				switch(req.query.type) {
					case 'event':
					case 'bestPics':
						return kernel.model.Event.findById(req.query.tid, cb);
					case 'feed':
						return kernel.model.Feed.findById(req.query.tid, cb);
					default:
						return cb(null);
				}
			}
		}, (err, result) => {
			if(err) return res.status(500).json({type: 'SERVER_ERROR'});
			if(!result.photo) {
				return res.status(404).json({type: 'NOT_FOUND'});
			}

			if(!result.belongTo || !result.belongTo._id) {
				return res.status(200).json({detail: result.photo, next: null, prev: null});
			}

			let getPhoto = (id) => {
				return (cb) => {
					kernel.model.Photo.findById(id, cb);
				};
			};

			let response = (res, ids) => {
				let idx = _.findIndex(ids, id => {
      		return id.toString() === result.photo._id.toString();
      	});
      	var funcs = {};
      	if(ids[idx+1]) {
      		funcs.next = getPhoto(ids[idx+1]);
      	}

      	if(ids[idx-1]) {
      		funcs.prev = getPhoto(ids[idx-1]);
      	}
       	async.parallel(funcs, (err, photos) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
	      	photos.next = photos.next || null;
	      	photos.prev = photos.prev || null;
	      	return res.status(200).json(_.merge({detail: result.photo}, photos));
	      });
      };
			
			if(req.query.type === 'bestPics') {
				async.waterfall([
	        (cb) => {
	        	kernel.model.Feed.find({
              eventId: result.belongTo._id,
              blocked: false
            }, (err, feeds) => {
              if(err) return cb(err);
              let photosId = [];
              _.each(feeds, feed => {
                photosId = photosId.concat(feed.photosId || []);
              });
              return cb(null, _.uniq(photosId));
            });
	        }
	      ],  (err, photoIds) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
        	let feedPhotoIds = _.reverse(_.sortBy(photoIds));
        	let belongToIds = _.reverse(_.sortBy(result.belongTo.photosId));
        	let ids = feedPhotoIds.concat(belongToIds);
        	return response(res, ids);
        });
			} else {
				let ids = _.reverse(_.sortBy(result.belongTo.photosId));
				return response(res, ids);
			}
		});
	});

	/*get my photos*/
	kernel.app.get('/api/v1/photos/my-photos', kernel.middleware.isAuthenticated(), (req, res) => {
		let page = req.query.page || 1;
		let pageSize = req.query.pageSize || 10;
		kernel.model.Photo.find({ownerId: (req.query.userId) ? req.query.userId : req.user._id, blocked: false})
		.limit(Number(pageSize))
	    .skip(pageSize * (page-1))
	    .sort({createdAt: 'desc'})
	    .then(photos => {
	    	kernel.model.Photo.count({ownerId: (req.query.userId) ? req.query.userId : req.user._id, blocked: false}).then(count => {
	    		return res.status(200).json({items: photos, totalItem: count});
	    	}).catch(err => {
	    		return res.status(500).json({type: 'SERVER_ERROR'});	
	    	});
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		});
	});

	kernel.app.put('/api/v1/photos/:id/block', kernel.middleware.isAuthenticated(), (req, res) => {
		async.parallel([
			(cb) => {
				if (req.user.role === 'admin') {
					cb(null, true);
				} else if (req.body.type==='user-profile') {
					if (!req.body.userId) {
						return cb({code: 422, type: 'MISSING_USER_ID', message: 'Missing user id'});
					}
					kernel.model.User.findById(req.body.userId).then(user => {
						if (!user) {
							return cb({code: 404, type: 'USER_NOT_FOUND', message: 'USER not found'});
						}
						if (user._id.toString()===req.user._id.toString()) {
							cb(null, true);
						} else {
							cb({code: 403, type: 'NOT_ALLOW', messsage: 'Not allow'});
						}
					});
				} else {
					if (!req.body.eventId) {
						return cb({code: 422, type: 'MISSING_EVENT_ID', message: 'Missing event id'});
					}
					kernel.model.Event.findById(req.body.eventId).then(event => {
						if (!event) {
							return cb({code: 404, type: 'EVENT_NOT_FOUND', message: 'Event not found'});
						}
						if (event.ownerId.toString()===req.user._id.toString()) {
							cb(null, true);
						} else {
							cb({code: 403, type: 'NOT_ALLOW', messsage: 'Not allow'});
						}
					});
				}
			}
		], (err, result) => {
			if (err) {
				return res.status(err.code).json({type: err.type, message: err.message});
			}
			kernel.model.Photo.findById(req.params.id).then(photo => {
				if (!photo) {
					return res.status(404).end();
				}
				photo.blocked = !photo.blocked;
				photo.blockedBy = (photo.blocked) ? req.user._id : null;
				photo.save().then(photo => {
					kernel.queue.create('EMAIL_BLOCK_UNBLOCKED_PHOTO', {photoId: photo._id}).save();
					return res.status(200).json({blocked: photo.blocked});
				}).catch(err => {
					return res.status(500).json({type: 'SERVER_ERROR'});
				});
			}).catch(err => {
				return res.status(500).json({type: 'SERVER_ERROR'});
			});
		});
	});

	/*Delete photo only allow created user*/
	kernel.app.delete('/api/v1/photos/:id', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.Photo.findById(req.params.id).then(photo => {
			if (!photo) {
				return res.status(404).end();
			}
			if (photo.ownerId.toString()===req.user._id.toString()) {
				photo.remove().then(() => {
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