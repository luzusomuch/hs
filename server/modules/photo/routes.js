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
				console.log(req.query.type);
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

			let getPhoto = (type, ids) => {
				return (cb) => {
					var condition = { 
						$and: [
							{ _id: { $in: ids } }
						]
					},
					sort = type === 'next' ? { _id: 1 } : { _id: -1 };
					if(type === 'next') {
						condition.$and.push({ _id: { $gt: result.photo._id } });
					} else {
						condition.$and.push({ _id: { $lt: result.photo._id } });
					}
					kernel.model.Photo.findOne(condition).sort(sort).limit(1).exec(cb);
				};
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
	        },

	        (feedPhotoIds, cb) => {
	        	
	         	/*var funcs = {};
	         	console.log(photo);
	         	if(!photo.next) funcs.next = getPhoto('next', result.belongTo.photosId, true);
	         	if(!Object.keys(funcs).length) {
	         		return cb(null, photo);
	         	}
	         	async.parallel(funcs, cb);*/
	        }
	      ], (err, photos) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
	      	return res.status(200).json(_.merge({detail: result.photo}, photos));
	      });
			} else {
				var funcs = {};
       	funcs.next = getPhoto('next', result.belongTo.photosId);
       	funcs.prev = getPhoto('prev', result.belongTo.photosId);
       	async.parallel(funcs, (err, photos) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
	      	return res.status(200).json(_.merge({detail: result.photo}, photos));
	      });
			}
		});
	});
};