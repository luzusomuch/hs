import Joi from 'joi'
module.exports = function(kernel) {
	kernel.app.post('/api/v1/categories/', kernel.middleware.isAuthenticated(), (req, res) => {  
    let model = new kernel.model.Like({objectName: req.params.objectName, objectId: req.params.objectId,  ownerId: req.user._id});
    model.save().then(like => {
      res.status(200).json(like);
    })
    .catch(err => {
      res.status(500).end();
    });
  });
};