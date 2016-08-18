import Joi from 'joi';
module.exports = function(kernel) {
	/*Send message*/
	kernel.app.post('/api/v1/threads', kernel.middleware.isAuthenticated(), (req, res) => {
		console.log(req.body);
	});
};