import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';

module.exports = function(kernel) {

	/*Get all feeds by event id*/
	kernel.app.get('/api/v1/feeds/:id/event', kernel.middleware.isAuthenticated(), (req, res) => {
		let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 5;
		kernel.model.Feed.find({eventId: req.params.id})
		.populate({
			path: 'ownerId', 
			select: '-password -salt', 
			populate: {path: 'avatar', model: 'Photo'}
		})
		.populate('photosId')
		.limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .exec().then(feeds => {
      kernel.model.Feed.count({eventId: req.params.id}).then(count => {
    	 return res.status(200).json({items: feeds, totalItem: count});
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    })
	});

	/*Create new feed*/
	kernel.app.post('/api/v1/feeds', kernel.middleware.isAuthenticated(), (req, res) => {
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
      let data = {
      	content: req.body.feed.content,
      	eventId: req.body.feed.eventId
      };

      let schema = Joi.object().keys({
      	content: Joi.string().required().options({
          language: {
            key: 'content'
          }
        }),
        eventId: Joi.string().required().options({
          language: {
            key: 'eventId'
          }
        })
      });

      var result = Joi.validate(data, schema, {
        stripUnknown: true,
        abortEarly: false,
        allowUnknown: true
      });

      if (result.error) {
      	let errors = [];
      	result.error.details.forEach(error => {
      		let type;
      		switch (error.type) {
      			case 'string.content':
      				type = 'FEED_CONTENT_REQUIRED';
      				break;
      			case 'string.eventId':
      				type = 'FEED_EVENT_REQUIRED';
      				break;
      			default:
      				break;
      		}
      		errors.push({type: type, path: error.path, message: error.message});
      	});
      	return res.status(422).json(errors);
      }

      async.each(req.files, (file, callback) => {
      	var photo = {
          ownerId: req.user._id,
          metadata: {
            tmp: file.filename
          }
        };
        let model = new kernel.model.Photo(photo);
        model.save().then(saved => {
          uploadedPhotoIds.push(saved._id);
          kernel.queue.create('PROCESS_AWS', saved).save();
          callback(null, uploadedPhotoIds);
        }).catch(err => {
          callback(err);
        });
      }, (err, result) => {
      	if (err) {
      		return res.status(500).json({type: 'SERVER_ERROR'})
      	}
      	data.photosId = uploadedPhotoIds;
      	data.ownerId = req.user._id;
      	kernel.model.Feed(data).save().then(feed => {
      		kernel.model.Feed.populate(feed, [
      			{path: 'ownerId', select: '-password -salt'},
      			{path: 'photosId'}
    			], (err, result) => {
    				return res.status(200).json(result);
    			});
      	}).catch(err => {
      		console.log(err);
      		return res.status(500).json({type: 'SERVER_ERROR'})
      	})
      });
    });
	});
};