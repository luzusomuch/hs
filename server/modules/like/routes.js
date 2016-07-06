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
          	obj.save().then(() => {
        			res.status(200).json({ liked: false });
          	}).catch(err => {
          		console.log(err);
          		res.status(200).json({ liked: false });
          	})
          });
        }

        let model = new kernel.model.Like({
          objectName: req.body.objectName,
          objectId: req.body.objectId,
          ownerId: req.user._id
        });
        model.save().then(() => {
          res.status(200).json({ liked: true });
        });
      });
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    });
	});
};