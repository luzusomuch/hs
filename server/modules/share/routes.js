import Joi from 'joi';
import moduleConfig from './moduleconfig';

module.exports = function(kernel) {
	kernel.app.post('/api/v1/shares', kernel.middleware.isAuthenticated(), (req, res) => {
		let schema = Joi.object().keys({
      objectId: Joi.string().required(),
      objectName: Joi.string().required()
    });

    let result = Joi.validate(req.body, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    //get model which is supported
    kernel.module.Share.attachModel(req.body.objectName);
    let supportedModel = kernel.model;
    if (!supportedModel[req.body.objectName]) {
      return res.status(422).end();
    }
    supportedModel[req.body.objectName].findById(req.body.objectId).then(obj => {
    	if (!obj) {
    		return res.status(404).end();
    	}

      let model = new kernel.model.Share({
        objectName: req.body.objectName,
        objectId: req.body.objectId,
        ownerId: req.user._id
      });
      model.save().then(() => {
        res.status(200).json({ shared: true });
      });
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    });
	});

	/**
   * Check user shared an object or not 
   */
  kernel.app.get('/api/v1/shares/:objectId/:objectName/check', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Share.findOne({ objectId: req.params.objectId, objectName:req.params.objectName, ownerId: req.user._id})
    .then(comment =>{
      if (!comment) {
        return res.status(200).json({shared:false});
      } else {
        return res.status(200).json({shared:true});
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
};