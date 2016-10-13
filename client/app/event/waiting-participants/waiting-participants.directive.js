'use strict';

class EventWaitingParticipantsCtrl {
	constructor($scope, $rootScope, EventService, $state, $localStorage, socket, $uibModal, RelationService, growl) {
		this.$uibModal = $uibModal;
		this.growl = growl;
		this.RelationService = RelationService;
		this.EventService = EventService;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.waitingParticipants = {
			pageSize: 10
		};
		this.onlineUsers = [];

		$scope.$watch('eId', (nv) => {
			if(nv) {
				EventService.getWaitingParticipants(nv, {pageSize: this.waitingParticipants.pageSize}).then(res => {
					this.waitingParticipants = res.data;
				});
			}
		});

		// Tracking online/offline user
	    socket.socket.on('tracking:user', (data) => {
	    	this.onlineUsers = data;
	    	$scope.$watch('vm.waitingParticipants.items', (nv) => {
	    		if (nv && nv.length > 0 && data) {
	    			_.each(this.waitingParticipants.items, (friend) => {
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
	    });

		this.isEventOwner = ($scope.eOwner && this.authUser._id===$scope.eOwner._id) ? true : false;
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
    			return this.onlineUsers;
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
			eOwner: '='
		},
		templateUrl: 'app/event/waiting-participants/view.html',
		controller: 'EventWaitingParticipantsCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventWaitingParticipantsCtrl', EventWaitingParticipantsCtrl);