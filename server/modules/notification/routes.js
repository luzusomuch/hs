
module.exports = function(kernel) {
	kernel.app.get('/api/v1/notifications/get-total-notifications', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.Notification.find({ownerId: req.user._id, read: false}).then(notifications => {
			return res.status(200).json({items: notifications});
		}).catch(err => {
			return res.status(500).json(err);
		});
	});

	kernel.app.put('/api/v1/notifications/mark-all-as-read', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.Notification.update({ownerId: req.user._id}, {read: true}, {multi: true}).then(() => {
			return res.status(200).end();
		}).catch(err => {
			return res.status(500).json(err);
		});
	});
};