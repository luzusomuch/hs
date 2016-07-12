'use strict';

class EventInviteCtrl {
	constructor($uibModalInstance,  User, Invite, eventId) {
		this.User = User;
		this.Invite = Invite;
		this.eventId = eventId;
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
		this.User.getFriends(page).then(
			res => {
				this.loading = false;
				this.users = this.users.concat(res.data);
			},
			() => this.loading = false
		);
	}

	invite(user) {
		this.Invite.intiveToEvent(user._id, this.eventId).then(
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
			eId : '='
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
						eventId: () => scope.eId
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