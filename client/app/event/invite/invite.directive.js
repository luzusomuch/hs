'use strict';

class EventInviteCtrl {
	constructor($uibModalInstance,  User, Invite, event, userId, socket) {
		this.User = User;
		this.Invite = Invite;
		this.event = event;
		this.userId = userId;
		this.socket = socket;
		this.users = [];
		this.loading = true;
		this.$uibModalInstance = $uibModalInstance;
		this.page = {
			friend: 1,
			user: 1
		};

		this.getFriends(this.page.friend);
	}

	getFriends(page) {
		this.User.getFriends(this.userId, page).then(
			res => {
				this.loading = false;
				this.users = this.users.concat(res.data.items);
				
				// remove event participants from friends list
				_.each(this.event.participantsId, (participant) => {
					let index = _.findIndex(this.users, (user) => {
						return user._id===participant._id;
					});
					if (index !== -1) {
						this.users.splice(index ,1);
					}
				});

				// Tracking online/offline user
			    this.socket.socket.on('tracking:user', (data) => {
			     	if (data && this.users) {
			     		_.each(this.users, (friend) => {
			     			friend.online = false;
			     			let index = _.findIndex(data, (item) => {
			     				return item===friend._id;
			     			});
			     			if (index !== -1) {
			     				friend.online = true;
			     			}
			     		});
			     	}
			    });
			},
			() => this.loading = false
		);
	}

	invite(user) {
		this.Invite.intiveToEvent(user._id, this.event._id).then(
			res => user.invited = true
		)
	}

	close() {
		this.$uibModalInstance.dismiss('cancel');
	}
}

angular.module('healthStarsApp').directive('hsEventInvite', ($uibModal) => {
	return {
		restrict: 'A',
		scope: {
			eId : '=',
			uId: '='
		},
		link: function(scope, elm) {
			var func =  function(e){
				e.preventDefault();
				$uibModal.open({
					templateUrl: 'app/event/invite/invite.html',
					controller: 'EventInviteCtrl',
					controllerAs: 'vm',
					backdrop : 'static',
					resolve: {
						event: (EventService) => {
							return EventService.get(scope.eId).then(resp => {
								return resp.data;
							});
						},
						userId: () => scope.uId
					}
				});
			};

			elm.bind('click', func);
			scope.$on('$destroy', function(){
				elm.unbind('click', func);
			});
		}
	};
}).controller('EventInviteCtrl', EventInviteCtrl);