import Joi from 'joi';
import _ from 'lodash';
import async from 'async';

module.exports = function(kernel) {
	kernel.app.delete('/api/v1/grantAwards/:id', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.GrantAward.findById(req.params.id).then(award => {
			if (!award) {
				return res.status(404).end();
			}
			if (award.ownerId.toString()===req.user._id.toString() || req.user.role==='admin') {
				award.deleted = true;
				award.deletedBy = req.user._id;
				award.save().then(() => {
					return res.status(200).end();
				}).catch(err => {
					return res.status(500).json({type: 'SERVER_ERROR'});		
				});
			} else {
				return res.status(403).end();
			}
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		});
	});	
};