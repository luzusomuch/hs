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
			event: (cb) => {
				if(!req.query.eid || !kernel.mongoose.Types.ObjectId.isValid(req.query.eid)) {
					return cb(null);
				}
				return kernel.model.Event.findById(req.query.eid, cb);
			}
		}, (err, result) => {
			if(err) return res.status(500).json({type: 'SERVER_ERROR'});

			if(!result.photo) {
				return res.status(404).json({type: 'NOT_FOUND'});
			}

			if(!result.event || !result.event._id) {
				return res.status(200).json({detail: result.photo, next: null, prev: null});
			}

			let type = req.query.type === 'bestPics' ? req.query.type : 'event';

			let getPhoto = (type) => {
				return (cb) => {
					var condition = { 
						$and: [
							{ _id: { $in: result.event.photosId } }
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
			
			if(type === 'bestPics') {
				async.waterfall([
	        (cb) => {
	          // Todo - get best pics based on total of comments
	          cb(null, {next: null, prev: null});
	        },
	        (photo, cb) => {
	         	var funcs = {};
	         	if(!photo.next) funcs.next = getPhoto('next');
	         	if(!photo.prev) funcs.prev = getPhoto('prev');
	         	if(!Object.keys(funcs).length) {
	         		return cb(null, photo);
	         	}
	         	async.parallel(funcs, cb);
	        }
	      ], (err, photos) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
	      	return res.status(200).json(_.merge({detail: result.photo}, photos));
	      });
			} else {
				var funcs = {};
       	funcs.next = getPhoto('next');
       	funcs.prev = getPhoto('prev');
       	async.parallel(funcs, (err, photos) => {
	      	if(err) return res.status(500).json({type: 'SERVER_ERROR'});
	      	return res.status(200).json(_.merge({detail: result.photo}, photos));
	      });
			}
		});
	});
};