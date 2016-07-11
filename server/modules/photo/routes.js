import Joi from 'joi';
import async from 'async';
import _ from 'lodash';

module.exports = function(kernel) {
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
            	console.log(feeds);
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

	kernel.app.put('/api/v1/photos/:id/block', kernel.middleware.isAuthenticated(), (req, res) => {
		if (!req.body.eventId) {
			return res.status(422).json({type: 'MISSING_EVENT_ID', message: 'Missing event id'});
		}
		kernel.model.Event.findById(req.body.eventId).then(event => {
			if (!event) {
				return res.status(404).end();
			}
			if (req.user.role === 'admin' || event.ownerId.toString()===req.user._id.toString()) {
				kernel.model.Photo.findById(req.params.id).then(photo => {
					if (!photo) {
						return res.status(404).end();
					}
					photo.blocked = !photo.blocked;
					photo.blockedBy = (photo.blocked) ? req.user._id : null;
					photo.save().then(photo => {
						return res.status(200).json({blocked: photo.blocked});
					}).catch(err => {
						return res.status(500).json({type: 'SERVER_ERROR'});
					});
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