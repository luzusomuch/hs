import async from 'async';
import Joi from 'joi';

module.exports = function(kernel) {
	/*Get all abouts content*/
	kernel.app.get('/api/v1/abouts/all', kernel.middleware.hasRole('admin'), (req, res) => {
		kernel.model.About.find({}).then(abouts => {
			kernel.model.About.count({}).then(count => {
				return res.status(200).json({items: abouts, totalItem: count});
			}).catch(err => {
				return res.status(500).json({type: 'SERVER_ERROR'});
			})
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		});
	});

	/*Create new about content*/
	kernel.app.post('/api/v1/abouts', kernel.middleware.hasRole('admin'), (req, res) => {
		if (!req.body.about) {
			return res.status(422).json({type: 'MISSING_ENTITY', message: 'Missing some entities'});
		}
		// validate 
    var about = {
      content: req.body.about.name,
      language: req.body.about.type
    };
    var schema = Joi.object().keys({
      content: Joi.string().required().options({
        language: {
          key: 'content'
        }
      }),
      language: Joi.string().required().options({
        language: {
          key: 'language'
        }
      })
    });
    
    var result = Joi.validate(about, schema, {
      stripUnknown: true,
      abortEarly: false,
      allowUnknown: true
    });

    if (result.error) {
      var errors = [];
      result.error.details.forEach(error => {
        var type;
        switch (error.type) {
          case 'string.content': 
            type = 'ABOUT_CONTENT_REQUIRED';
            break;
          case 'string.language':
            type = 'ABOUT_LANGUAGE_REQUIRED';
            break;
          default:
            break;
        }
        errors.push({type: type, path: error.path, message: error.message});
      });
      return res.status(422).json(errors);
    }

    kernel.model.About(about).save().then(saved => {
    	return res.status(200).json(saved);
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    });
	});
};