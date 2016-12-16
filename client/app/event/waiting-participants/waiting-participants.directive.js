'use strict';

class EventWaitingParticipantsCtrl {
	constructor($scope, $rootScope, EventService, $state, $localStorage, socket, $uibModal, RelationService, growl) {
		this.$uibModal = $uibModal;
		this.growl = growl;
		this.RelationService = RelationService;
		this.EventService = EventService;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.$scope = $scope;
		this.waitingParticipants = {
			pageSize: 10
		};

		$scope.$watch('eId', (nv) => {
			if(nv) {
				EventService.getWaitingParticipants(nv, {pageSize: this.waitingParticipants.pageSize}).then(res => {
					this.waitingParticipants = res.data;
				});
			}
		});

		$rootScope.$on('event-update-participants', () => {
			EventService.getWaitingParticipants($scope.eId, {pageSize: this.waitingParticipants.pageSize}).then(res => {
				this.waitingParticipants = res.data;
			});
		});

		$rootScope.$watch('onlineUsers', nv => {
			$scope.onlineUsers = nv;
		});

	  $scope.$watchGroup(['onlineUsers', 'vm.waitingParticipants.items'], (nv) => {
	  	if (nv[0] && nv[1]) {
	  		_.each(nv[1], (friend) => {
	  			let index = _.findIndex(nv[0], (onlineId) => {
	  				return onlineId.toString()===friend._id.toString();
	  			});
	  			if (index !== -1) {
	  				friend.online=true;
	  			}
	  		});
	  	}
	  }, true);

		this.isEventOwner = ($scope.eOwner && (this.authUser._id===$scope.eOwner._id || this.authUser._id===$scope.eAdmin._id)) ? true : false;
	}

	// banUser(user) {
	// 	if (this.isEventOwner) {
	// 		this.EventService.banUser(this.$state.params.id, user._id).then(() => {
	// 			let index = _.findIndex(this.participants.items, (participant) => {
	// 				return participant._id===user._id;
	// 			});
	// 			if (index !== -1) {
	// 				this.participants.items.splice(index ,1);
	// 				this.participants.totalItem -=1;
	// 			}
	// 		}).catch(() => {
	// 			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	// 		});
	// 	}
	// }

	// grantAward(user) {
	// 	if (this.isEventOwner && !user.isGrantedAward && this.eAward.type==='organizer') {
	// 		this.EventService.grantAward(this.$state.params.id, user._id).then(() => {
	// 			user.isGrantedAward = true;
	// 		}).catch(() => {
	// 			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	// 		});
	// 	}
	// }

	showAllWaitingParticipants() {
		this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/event/modal/event-waiting-participants.html',
    	controller: 'WaitingParticipantsCtrl',
    	controllerAs: 'wp',
    	resolve: {
    		onlineUsers: () => {
    			return this.$scope.onlineUsers;
    		}
    	}
    });
	}

	addFriend(friend) {
		this.RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
  		friend.friendStatus = resp.data.type;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}
}

angular.module('healthStarsApp').directive('hsEventWaitingParticipants', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '=',
			eOwner: '=',
			eAdmin: '='
		},
		templateUrl: 'app/event/waiting-participants/view.html',
		controller: 'EventWaitingParticipantsCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventWaitingParticipantsCtrl', EventWaitingParticipantsCtrl);