import Joi from 'joi';
import async from 'async';
import _ from 'lodash';

module.exports = function(kernel) {
	/*Create new event invite request*/
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

	/*Accept invite event request*/
	kernel.app.put('/api/v1/invites/:id', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.InvitationRequest.findById(req.params.id).then(invite => {
			if (!invite) {
				return res.status(404).end();
			}
			if (invite.toUserId.toString()===req.user._id.toString()) {
				kernel.model.Event.findById(invite.objectId).then(event => {
					if (!event) {
						return res.status(404).end();
					}

					// when total parcipants has reached the top then check waiting list
		      if (event.participantsId.length >= event.numberParticipants && event.waitingParticipantIds.indexOf(req.user._id) !== -1) {
		        // the current user was already joined or an owner of that event
  					invite.remove().then(() => {
							return res.status(200).end();
						}).catch(err => {
							return res.status(500).json({type: 'SERVER_ERROR'});
						});
		      }
					
					let availableUser = _.clone(event.participantsId);
  				availableUser.push(event.ownerId);

  				if (_.findIndex(availableUser, (userId) => {
  					return userId.toString()===req.user._id.toString();
  				}) !== -1) {
  					// the current user was already joined or an owner of that event
  					invite.remove().then(() => {
							return res.status(200).end();
						}).catch(err => {
							return res.status(500).json({type: 'SERVER_ERROR'});
						});
  				} else {
    				// If current user wasn't join this event then add him to participants list
    				if (event.limitNumberOfParticipate && event.numberParticipants > 0 && event.participantsId.length >= event.numberParticipants) {
		          if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
		            event.waitingParticipantIds.push(req.user._id);
		          } else {
		            event.waitingParticipantIds = [req.user._id];
		          }
		        } else {
		          event.participantsId.push(req.user._id);
		          event.stats.totalParticipants = event.participantsId.length;
		        }
						// add current user to attended ids list
		        if (event.attendedIds) {
		          event.attendedIds.push(req.user._id);
		        } else {
		          event.attendedIds = [req.user._id]
		        }
						event.save().then(event => {
							kernel.queue.create(kernel.config.ES.events.UPDATE, {
								type: kernel.config.ES.mapping.eventType, 
								id: event._id.toString(), data: event
							}).save();
							// grant award for current user
							kernel.model.Award.findById(event.awardId).then(award => {
								if (!award) {
									// remove invite request when not found award
									invite.remove().then(() => {
										return res.status(200).end();
									}).catch(err => {
										return res.status(500).json({type: 'SERVER_ERROR'});
									});
								}
								async.parallel([
									(cb) => {
										if (award.type==='gps' && req.user.accessViaApp) {
			                kernel.model.GrantAward({
		                  	ownerId: req.user._id,
		                  	awardId: award._id,
		                  	eventId: event._id
			                }).save().then(data => {
		                  	kernel.queue.create('EMAIL_GRANTED_AWARD', data).save();
		                  	cb(null);
			                }).catch(cb);
		              	} else if (award.type==="accepted") {
			                kernel.model.GrantAward({
		                  	ownerId: req.user._id,
		                  	awardId: award._id,
		                  	eventId: event._id
			                }).save().then(data => {
		                  	kernel.queue.create('EMAIL_GRANTED_AWARD', data).save();
		                  	cb(null);
			                }).catch(cb);
		              	} else {
			                cb();
		              	}
									}
								], (err) => {
									if (err) {
										return res.status(500).json({type: 'SERVER_ERROR'});
									}
									// after granted award completed then remove invite request
									invite.remove().then(() => {
										return res.status(200).end();
									}).catch(err => {
										return res.status(500).json({type: 'SERVER_ERROR'});
									});
								});
							}).catch(err => {
								return res.status(500).json({type: 'SERVER_ERROR'});		
							});
						}).catch(err => {
							console.log(err);
							return res.status(500).json({type: 'SERVER_ERROR'});			
						});
  				}
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

	/*Reject event invite request*/
	kernel.app.delete('/api/v1/invites/:id', kernel.middleware.isAuthenticated(), (req, res) => {
		kernel.model.InvitationRequest.findById(req.params.id).then(invite => {
			if (!invite) {
				return res.status(404).end();
			}
			if (invite.toUserId.toString()===req.user._id.toString()) {
				invite.remove().then(() => {
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