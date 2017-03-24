import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
import { PhotoHelper } from '../../helpers';

module.exports = function(kernel) {

	/*Get all feeds by id and type user or event*/
	kernel.app.get('/api/v1/feeds/:id/:type', kernel.middleware.isAuthenticated(), (req, res) => {
		let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 5;
    let condition = {};
    if (req.params.type==='event') {
      condition = {eventId: req.params.id};
    } else {
      condition = {userId: req.params.id};
    }
		kernel.model.Feed.find(condition)
		.populate({
			path: 'ownerId', 
			select: '-password -salt', 
			populate: {path: 'avatar', model: 'Photo'}
		})
		.populate('photosId')
		.limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .exec().then(feeds => {
      kernel.model.Feed.count(condition).then(count => {
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
      if (!req.body.feed) {
        return res.status(422).end();
      }
      let uploadedPhotoIds = [];
      // validation
      let data = {
        content: req.body.feed.content
      };
      if (req.body.feed.userFeed === 'true') {
        // Create new feed for specific user
        data.userId = req.body.feed.userId;
      } else {
        // Create new feed for an event
        if (!req.body.feed.eventId) {
          return res.status(422).end();
        }
        data.eventId = req.body.feed.eventId;
      }
      let schema = Joi.object().keys({
      	content: Joi.string().required().options({
          language: {
            key: 'content'
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
      			default:
      				break;
      		}
      		errors.push({type: type, path: error.path, message: error.message});
      	});
      	return res.status(422).json(errors);
      }
      async.parallel([
        (cb) => {
          if (data.eventId) {
            kernel.model.Event.findById(data.eventId).then(event => {
              if (!event) {
                return cb({type: 'EVENT_NOT_FOUND', code: 404, message: 'Event not found'});
              }
              if (event.blocked) {
                return cb({type: 'EVENT_BLOCKED', code: 500, message: 'Event blocked'});
              }
              cb(null);
            }).catch(cb);
          } else {
            cb(null);
          }
        }
      ], (err) => {
        if (err) {
          return res.status(err.code).json({type: err.type, message: err.message});
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

            PhotoHelper.UploadOriginPhoto(saved, (err, result) => {
              if (err) {
                return res.status(500).json(err);
              }
              saved.metadata.original = result.s3url;
              saved.keyUrls = {original: result.key};
                
              kernel.queue.create('PROCESS_AWS', saved).save();
              callback(null, uploadedPhotoIds);
            });

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
              {
                path: 'ownerId', 
                select: '-password -salt',
                populate: {path: 'avatar', model: 'Photo'}
              },
              {path: 'photosId'},
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
	});

  /*block/unblock feed*/
  kernel.app.put('/api/v1/feeds/:id/block', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Feed.findById(req.params.id)
    .populate('eventId')
    .populate('userId')
    .exec().then(feed => {
      if (!feed) {
        return res.status(404).end();
      }

      let availableUsers = [feed.ownerId.toString()];
      if (feed.eventId && feed.eventId.adminId) {
        availableUsers.push(feed.eventId.adminId.toString());
      }

      if (feed.eventId && feed.eventId.ownerId) {
        availableUsers.push(feed.eventId.ownerId.toString());
      } else if (feed.userId && feed.userId._id) {
        availableUsers.push(feed.userId._id.toString());
      }

      if (availableUsers.indexOf(req.user._id.toString()) !== -1) {
        feed.blocked = !feed.blocked;
        feed.blockedByUserId = (feed.blocked) ? req.user._id : null;
        feed.save().then(saved => {
          return res.status(200).json({blocked: saved.blocked});
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