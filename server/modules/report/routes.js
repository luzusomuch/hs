import Joi from 'joi'
module.exports = function(kernel) {
	kernel.app.post('/api/v1/reports', kernel.middleware.isAuthenticated(), (req, res) => {
		if (req.user.deleted && req.user.deleted.status) {
      return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
    }
    if (req.user.blocked && req.user.blocked.status) {
      return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
    }
		let data = req.body;
		data.reporterId = req.user._id;

		var schema = Joi.object().keys({
      description: Joi.string().required().options({
        language: {
          key: 'description'
        }
      }),
      type: Joi.string().required().options({
        language: {
          key: 'type'
        }
      }),
      reportedItemId: Joi.string().required().options({
        language: {
          key: 'reportedItemId'
        }
      })
    });
    
    var result = Joi.validate(data, schema, {
      stripUnknown: true,
      abortEarly: false,
      allowUnknown: true
    });

    if (result.error) {
      var errors = [];
      result.error.details.forEach(error => {
        var type;
        switch (error.type) {
          case 'string.description': 
            type = 'REPORT_DESCRIPTION_REQUIRED';
            break;
          case 'string.type':
            type = 'REPORT_TYPE_REQUIRED';
            break;
          case 'string.reportedItemId':
          	type = 'REPORT_ITEM_REQUIRED';
          	break;
          default:
            break;
        }
        errors.push({type: type, path: error.path, message: error.message});
      });
      return res.status(422).json(errors);
    }
    kernel.model.Report(data).save().then(saved => {
    	return res.status(200).end();
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    })
	});
};