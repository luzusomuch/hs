'use strict';

class EventAttendingCtrl {
	constructor($scope, EventService, $state, $localStorage) {
		this.EventService = EventService;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.participants = {};
		
		$scope.$watch('eId', (nv) => {
			if(nv) {
				EventService.getParticipants(nv).then(res => {
					this.participants = res.data
				});
			}
		});

		this.isEventOwner = (this.authUser._id===$scope.eOwner._id) ? true : false;
	}

	banUser(user) {
		if (this.isEventOwner) {
			this.EventService.banUser(this.$state.params.id, user._id).then(() => {
				let index = _.findIndex(this.participants.items, (participant) => {
					return participant._id===user._id;
				});
				if (index !== -1) {
					this.participants.items.splice(index ,1);
					this.participants.total -=1;
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TOTO show error
		}
	}

	grantAward(user) {
		if (this.isEventOwner) {
			this.EventService.grantAward(this.$state.params.id, user._id).then(() => {
				
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}
}

angular.module('healthStarsApp').directive('hsEventAttending', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '=',
			eOwner: '=',
			eAward: '='
		},
		templateUrl: 'app/event/attending/attending.html',
		controller: 'EventAttendingCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventAttendingCtrl', EventAttendingCtrl);