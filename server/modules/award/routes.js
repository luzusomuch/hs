import Joi from 'joi';
import multer from 'multer';
import async from 'async';

module.exports = function(kernel) {
  /**
   * Create new award
   */
  kernel.app.post('/api/v1/awards/', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.queue.create('TOTAL_EVENT_JOINED', {userId: req.user._id}).save();
    if (req.user.deleted && req.user.deleted.status) {
      return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
    }
    if (req.user.blocked && req.user.blocked.status) {
      return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
    }
  	// TODO - create a function to upload image to s3. Then saved s3 link to a photo schema
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
    }).single('file');

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      if (!req.file) {
        return res.status(422).json({type: 'AWARD_IMAGE_REQUIRED', path: 'photo', message: 'Award image is required'});
      }
      if (!req.body.award) {
        return res.status(422).json({type: 'AWARD_MISSING_ENTITIES', path: 'all', message: 'Award is missing some entities'});
      }
      // validate 
      var award = {
        objectName: req.body.award.name,
        type: req.body.award.type,
        ownerId: req.user._id
      };
      var schema = Joi.object().keys({
        objectName: Joi.string().required().options({
          language: {
            key: 'name'
          }
        }),
        type: Joi.string().required().options({
          language: {
            key: 'type'
          }
        })
      });
      
      var result = Joi.validate(award, schema, {
        stripUnknown: true,
        abortEarly: false,
        allowUnknown: true
      });

      if (result.error) {
        var errors = [];
        result.error.details.forEach(error => {
          var type;
          switch (error.type) {
            case 'string.name': 
              type = 'AWARD_NAME_REQUIRED';
              break;
            case 'string.type':
              type = 'AWARD_TYPE_REQUIRED';
              break;
            default:
              break;
          }
          errors.push({type: type, path: error.path, message: error.message});
        });
        return res.status(422).json(errors);
      }

      var photo = {
        ownerId: req.user._id,
        metadata: {
          tmp: req.file.filename
        }
      };
      let model = new kernel.model.Photo(photo);
      model.save().then(saved => {
        // create a queue to resize and upload to s3
        kernel.queue.create('PROCESS_AWS', saved).save();
        award.objectPhotoId = saved._id;
        let awardModel = new kernel.model.Award(award);
        awardModel.save().then(result => {
          result.objectPhotoId = saved;
          return res.status(200).json(result);
        }).catch(() => {
          // remove upload photo when save award error
          saved.remove().exec().then(() => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          }).catch(() => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      });
    });
  });
  
  /**
   * Get list of awards created by current user
   */
  kernel.app.get('/api/v1/awards/:id/all', kernel.middleware.isAuthenticated(), (req, res) => {
    var condition = {};
    if (req.params.id==='me') {
      condition = {ownerId: req.user._id};
    } else {
      condition = {ownerId: req.params.id};
    }
    kernel.model.Award.find(condition)
    .populate('objectPhotoId')
    .exec().then(awards =>{
      res.status(200).json({items: awards, totalItem: awards.length});
    }).catch(err => {
      res.status(500).end();
    });
  });

  /*
  get list of granted awards by current user
  */
  kernel.app.get('/api/v1/awards/:id/grantedAwards', kernel.middleware.isAuthenticated(), (req, res) => {
    let condition = {};
    if (req.params.id==='me') {
      condition = {ownerId: req.user._id};
    } else {
      condition = {ownerId: req.params.id};
    }
    kernel.model.GrantAward.find(condition)
    .populate({
      path: 'awardId', 
      populate: {path: 'objectPhotoId', model: 'Photo'}
    })
    .populate({
      path: 'eventId', 
      populate: {path: 'categoryId', model: 'Category'}
    }).exec().then(awards => {
      let result = [];
      async.each(awards, (award, callback) => {
        let aw = award.toJSON();
        kernel.model.User.findById(award.eventId.ownerId, '-password -salt')
        .populate('avatar')
        .then(u => {
          if (u) {
            let user = u.toJSON();
            kernel.model.GrantAward.count({ownerId: user._id}).then(count => {
              user.totalAwards = count;
              aw.eventId.ownerId = user;
              result.push(aw);
              callback();
            }).catch(callback);
          } else {
            result.push(aw);
            callback({error: 'User not found'});
          }
        }).catch(callback);
      }, (err) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        return res.status(200).json({items: result, totalItem: result.length});
      });
    }).catch(err => {
      console.log(err);
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};