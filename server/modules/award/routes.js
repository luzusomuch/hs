import Joi from 'joi'
module.exports = function(kernel) {
  /**
   * Create new award
   */
  kernel.app.post('/api/v1/awards/', kernel.middleware.isAuthenticated(), (req, res) => {
    if (req.user.deleted && req.user.deleted.status) {
      return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
    }
    if (req.user.blocked && req.user.blocked.status) {
      return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
    }
  	// TODO - create a function to upload image to s3. Then saved s3 link to a photo schema
  	var savedPhotoId = req.user._id;
    //TODO - validator
    var data = {
      objectName: req.body.objectName,
      objectDescription: req.body.objectDescription,
      ownerId: req.user._id,
      objectPhotoId: savedPhotoId
    };

    var schema = Joi.object().keys({
      objectName: Joi.string().required(),
      objectDescription: Joi.string().required(),
      objectPhotoId: Joi.string().required
    });
    
    var result = Joi.validate(data, schema)
    if (result.error) {
      return res.status(422).json(result.error);
    }
      
    let model = new kernel.model.Award(data);
    model.save().then(award => {
      res.status(200).json(award);
    })
    .catch(err => {
      //TODO - handle error
      res.status(500).end();
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
};