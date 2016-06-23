import Joi from 'joi'
module.exports = function(kernel) {
  /**
   * Create new award
   */
  kernel.app.post('/api/v1/awards/', kernel.middleware.isAuthenticated(), (req, res) => {
  	// TODO - create a function to upload image to s3. Then saved s3 link to a photo schema
  	var savedPhotoId = req.user._id;
    //TODO - validator
    var data = {
      objectName: req.body.objectName,
      objectDescription: req.body.objectDescription,
      ownerId: req.user._id,
      objectPhotoId: savedPhotoId
    }
    var schema = Joi.object().keys({
      objectName: Joi.string().required(),
      objectDescription: Joi.string().required()
    })
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
  kernel.app.get('/api/v1/awards/', kernel.middleware.isAuthenticated(), (req, res) => {
    //TODO - validator
    kernel.model.Like.find({ownerId:req.user._id})
    .then(awards =>{
      res.status(200).json(awards);
    })
    .catch(err => {
      //TODO - handle error
      res.status(500).end();
    });
  });
};