module.exports = (kernel) => {
	// get all company account requested list in backend
	kernel.app.get('/api/v1/companyAccountRequests/all', kernel.middleware.hasRole('admin'), (req, res) => {
		let pageSize = req.query.pageSize || 10;
		let page = req.query.page || 1;
		let limit = (page-1)*pageSize;

		kernel.model.CompanyAccountRequest.find({})
		.populate({
			path: 'ownerId', select: '-password -salt',
			populate: {
				path: 'avatar', model: 'Photo'
			}
		})
		.limit(pageSize)
		.skip(limit)
		.sort({createdAt: -1})
		.exec().then(requests => {
			kernel.model.CompanyAccountRequest.count({}).then(count => {
				return res.status(200).json({items: requests, totalItem: count});
			}).catch(err => {
				return res.status(500).json({type: 'SERVER_ERROR'});	
			});
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		})
	});

	// accept request
	kernel.app.put('/api/v1/companyAccountRequests/:id', kernel.middleware.hasRole('admin'), (req, res) => {
		kernel.model.CompanyAccountRequest.findById(req.params.id).then(request => {
			if (!request) {
				return res.status(404).end();
			}
			kernel.model.User.findById(request.ownerId).then(user => {
				if (!user) {
					return res.status(404).end();		
				}
				user.isCompanyAccount = true;
				user.save().then(() => {
					request.remove().then(() => {
						return res.status(200).end();
					}).catch(err => {
						return res.status(500).json({type: 'SERVER_ERROR'});	
					});
				}).catch(err => {
					return res.status(500).json({type: 'SERVER_ERROR'});
				});
			}).catch(err => {
				return res.status(500).json({type: 'SERVER_ERROR'});
			});
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		});
	});

	// reject request
	kernel.app.delete('/api/v1/companyAccountRequests/:id', kernel.middleware.hasRole('admin'), (req, res) => {
		kernel.model.CompanyAccountRequest.findById(req.params.id).then(request => {
			if (!request) {
				return res.status(404).end();
			}
			request.remove().then(() => {
				return res.status(200).end();
			}).catch(err => {
				return res.status(500).json({type: 'SERVER_ERROR'});
			});
		}).catch(err => {
			return res.status(500).json({type: 'SERVER_ERROR'});
		});
	});
};