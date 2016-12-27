import Joi from 'joi';
import moduleConfig from './moduleconfig';

module.exports = function(kernel) {
	kernel.app.post('/api/v1/likes', kernel.middleware.isAuthenticated(), (req, res) => {
		let schema = Joi.object().keys({
      objectId: Joi.string().required(),
      objectName: Joi.string().required()
    });

    let result = Joi.validate(req.body, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    //get model which is supported
    kernel.module.Like.attachModel(req.body.objectName);
    let supportedModel = kernel.model;
    if (!supportedModel[req.body.objectName]) {
      return res.status(422).end();
    }
    supportedModel[req.body.objectName].findById(req.body.objectId).then(obj => {
    	if (!obj) {
    		return res.status(404).end();
    	}
      if (req.body.objectName==='Event' && obj.blocked) {
        return res.status(500).json({type: 'EVENT_BLOCKED', message: 'Event blocked'});
      }
    	kernel.model.Like.findOne({
        ownerId: req.user._id,
        objectName: req.body.objectName,
        objectId: req.body.objectId
      }).then(like => {
        if (like) {
          return like.remove().then(() => {
          	let totalLike = obj.get('totalLike');
          	totalLike -=1;
          	obj.set('totalLike', totalLike);
          	obj.save().then(newObj => {
          		kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: newObj._id.toString(), data: newObj}).save();
        			return res.status(200).json({ liked: false });
          	}).catch(err => {
          		return res.status(200).json({ liked: false });
          	})
          });
        }

        let model = new kernel.model.Like({
          objectName: req.body.objectName,
          objectId: req.body.objectId,
          ownerId: req.user._id
        });
        model.save().then(() => {
          if (req.body.objectName==='Event') {
            // create notification
            kernel.queue.create('CREATE_NOTIFICATION', {
              ownerId: obj.ownerId,
              toUserId: obj.ownerId,
              fromUserId: req.user._id,
              type: 'liked-event',
              element: obj
            }).save();
          }
          return res.status(200).json({ liked: true });
        });
      });
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    });
	});

	/**
   * Check user liked an object or not 
   */
  kernel.app.get('/api/v1/likes/:objectId/:objectName/check', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Like.findOne({ objectId: req.params.objectId, objectName:req.params.objectName, ownerId: req.user._id})
    .then(comment =>{
      if (!comment) {
        return res.status(200).json({liked:false});
      } else {
        return res.status(200).json({liked:true});
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
};