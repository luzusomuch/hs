import async from 'async';
import Joi from 'joi';
import multer from 'multer';

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
		if (!req.body) {
			return res.status(422).json({type: 'MISSING_ENTITY', message: 'Missing some entities'});
		}
		// validate 
    var about = {
      content: req.body.content,
      language: req.body.language.toLowerCase()
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
    kernel.model.About.findOne({language: about.language}).then(data => {
      if (data) {
        return res.status(409).json({type: 'ABOUT_CONTENT_EXISTED', message: 'This about content language is existed'});
      }
      kernel.model.About(about).save().then(saved => {
      	return res.status(200).json(saved);
      }).catch(err => {
      	return res.status(500).json({type: 'SERVER_ERROR'});
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
	});

  /*Upload sound for landing page*/
  kernel.app.post('/api/v1/abouts/sound', kernel.middleware.hasRole('admin'), (req, res) => {
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, kernel.config.tmpSoundFolder)
      },
      filename: (req, file, cb) => {
        return cb(null, 'main.mp3');
      }
    });
    let upload = multer({
      storage: storage
    }).single('file');

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      return res.status(200).end();
    });
  });

  /*Delete selected language*/
  kernel.app.delete('/api/v1/abouts/:id', kernel.middleware.hasRole('admin'), (req, res) => {
    kernel.model.About.findById(req.params.id).then(about => {
      if (!about) {
        return res.status(404).end();
      }
      about.remove().then(() => {
        return res.status(200).end();
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Update selected about*/
  kernel.app.put('/api/v1/abouts/:id', kernel.middleware.hasRole('admin'), (req, res) => {
    kernel.model.About.findById(req.params.id).then(data => {
      if (!data) {
        return res.status(404).end();
      }
      if (!req.body) {
        return res.status(422).json({type: 'MISSING_ENTITY', message: 'Missing some entities'});
      }
      // validate 
      var about = {
        content: req.body.content,
        language: req.body.language.toLowerCase()
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
      data.content = about.content;
      data.language = about.language;
      data.save().then(() => {
        return res.status(200).end();
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};