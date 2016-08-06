import Joi from 'joi';
import multer from 'multer';
import async from 'async';
import {S3} from './../../components';


module.exports = function(kernel) {
	kernel.app.post('/api/v1/categories/', kernel.middleware.hasRole('admin'), (req, res) => {  
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
        return res.status(500).json({type: 'SERVER_ERROR', err: err});    
      }
      if (!req.file) {
        return res.status(422).json({type: 'MISSING_CATEGORY_IMAGE'});
      }
      if (!req.body.category) {
        return res.status(422).json({type: 'MISSING_ENTITY'});
      }
      // validation 
      let data = {
        name: req.body.category.name,
        type: req.body.category.type,
        description: req.body.category.description
      };
      var schema = Joi.object().keys({
        name: Joi.string().required().options({
          language: {
            key: 'name'
          }
        }),
        type: Joi.string().required().options({
          language: {
            key: 'type'
          }
        }),
        description: Joi.string().required().options({
          language: {
            key: 'description'
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
            case 'string.name': 
              type = 'CATEGORY_NAME_REQUIRED';
              break;
            case 'string.type':
              type = 'CATEGORY_TYPE_REQUIRED';
              break;
            case 'string.description':
              type = 'CATEGORY_DESCRIPTION_REQUIRED';
              break;
            default:
              break;
          }
          errors.push({type: type, path: error.path, message: error.message});
        });
        return res.status(422).json(errors);
      }

      S3.uploadFile(req.file.path, {
        s3Params: {
          ACL: 'public-read'
        },
        folder: 'photos'
      }, (err, result) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR', err: err});
        }
        data.imagePath = S3.getPublicUrl(result.key);
        let model = new kernel.model.Category(data);
        model.save().then(category => {
          res.status(200).json(category);
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR', err: err});
        });
      });
    });
  });

  // Get all category
  kernel.app.get('/api/v1/categories', (req, res) => {
    kernel.model.Category.find({}).then(categories => {
      return res.status(200).json({items: categories, totalItem: categories.length});
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  kernel.app.put('/api/v1/categories/:id', kernel.middleware.hasRole('admin'), (req, res) => {
    kernel.model.Category.findById(req.params.id).then(category => {
      if (!category) {
        return res.status(404).end();
      }

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
        if (!req.body.category) {
          return res.status(422).json({type: 'MISSING_ENTITY'});
        }
        // validation 
        let data = {
          name: req.body.category.name,
          type: req.body.category.newType,
          description: req.body.category.description
        };
        var schema = Joi.object().keys({
          name: Joi.string().required().options({
            language: {
              key: 'name'
            }
          }),
          type: Joi.string().required().options({
            language: {
              key: 'type'
            }
          }),
          description: Joi.string().required().options({
            language: {
              key: 'description'
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
              case 'string.name': 
                type = 'CATEGORY_NAME_REQUIRED';
                break;
              case 'string.type':
                type = 'CATEGORY_TYPE_REQUIRED';
                break;
              case 'string.description':
                type = 'CATEGORY_DESCRIPTION_REQUIRED';
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
            if (req.file) {
              S3.uploadFile(req.file.path, {
                s3Params: {
                  ACL: 'public-read'
                },
                folder: 'photos'
              }, (err, result) => {
                if (err) {
                  return cb(err);
                }
                category.imagePath = S3.getPublicUrl(result.key);
                cb(null);
              });
            } else {
              cb(null);
            }
          }
        ], (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});      
          }
          category.name = req.body.category.name;
          category.description = req.body.category.description;
          category.type = req.body.category.newType;
          category.save().then(saved => {
            console.log(saved);
            return res.status(200).json(saved);
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});      
          });
        });
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};