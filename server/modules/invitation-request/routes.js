import Joi from 'joi';
import async from 'async';
module.exports = function(kernel) {

	kernel.app.post('/api/v1/invites/event', kernel.middleware.isAuthenticated(), (req, res) => {
		if(!req.body.eventId || !req.body.userId) {
			return res.status(400).json({type: 'BAD_REQUEST'});
		}

		async.parallel({
			event: (cb) => {
				kernel.model.Event.findById(req.body.eventId, cb);
			},

			user: (cb) => {
				kernel.model.User.findById(req.body.userId, cb);
			}
		}, (err, result) => {
			if(err) return res.status(500).json({type: 'SERVER_ERROR'});
			if(!result.event) return res.status(404).json({type: 'EVENT_NOT_FOUND'});
			if(!result.user) return res.status(404).json({type: 'USER_NOT_FOUND'});

			let invite = new kernel.model.InvitationRequest({
				fromUserId: req.user._id,
				toUserId: req.body.userId,
				objectId: req.body.eventId
			});
			invite.save().then(
				saved => {
					let url = `${kernel.config.baseUrl}event/detail/${result.event._id}`;
		      kernel.emit('SEND_MAIL', {
		        template: 'inviteToEvent.html',
		        subject: 'Invitation for attending ' + result.event.name + ' event',
		        data: {
		          user: result.user,
		          event: result.event,
		          inviteUser: req.user,
		          url: url
		        },
		        to: result.user.email
		      });
					return res.status(200).json({type: 'SUCCESS'})
				},
				err => res.status(500).json({type: 'SERVER_ERROR'})
			);
		});

	});

};