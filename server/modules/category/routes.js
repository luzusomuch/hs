import Joi from 'joi'
module.exports = function(kernel) {
	kernel.app.post('/api/v1/categories/', kernel.middleware.hasRole('admin'), (req, res) => {  
		// TODO- create a function to upload file to s3
		var s3PublicUrl = "s3PublicUrl";
    let model = new kernel.model.Category({
    	name: req.body.name, 
    	description: req.body.description,
    	imagePath: s3PublicUrl
    });
    model.save().then(category => {
      res.status(200).json(category);
    }).catch(err => {
      res.status(500).json(err);
    });
  });
};