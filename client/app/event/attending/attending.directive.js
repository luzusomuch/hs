'use strict';

class EventAttendingCtrl {
	constructor($scope, $rootScope, EventService, $state, $localStorage, socket, $uibModal, RelationService, growl) {
		this.$uibModal = $uibModal;
		this.growl = growl;
		this.RelationService = RelationService;
		this.EventService = EventService;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.participants = {
			pageSize: 10
		};
		this.eAward = $scope.eAward;
		this.onlineUsers = [];

		$scope.$watch('eId', (nv) => {
			if(nv) {
				EventService.getParticipants(nv, {pageSize: this.participants.pageSize}).then(res => {
					this.participants = res.data;
				});
			}
		});

		$rootScope.$on('event-update-participants', () => {
			EventService.getParticipants($scope.eId, {pageSize: this.participants.pageSize}).then(res => {
				this.participants = res.data;
			});
		});

		// Tracking online/offline user
	    socket.socket.on('tracking:user', (data) => {
	    	this.onlineUsers = data;
	    	$scope.$watch('vm.participants.items', (nv) => {
	    		if (nv && nv.length > 0 && data) {
	    			_.each(this.participants.items, (friend) => {
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

	banUser(user) {
		if (this.isEventOwner) {
			this.EventService.banUser(this.$state.params.id, user._id).then(() => {
				let index = _.findIndex(this.participants.items, (participant) => {
					return participant._id===user._id;
				});
				if (index !== -1) {
					this.participants.items.splice(index ,1);
					this.participants.totalItem -=1;
				}
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		}
	}

	grantAward(user) {
		if (this.isEventOwner && !user.isGrantedAward && this.eAward.type==='organizer') {
			this.EventService.grantAward(this.$state.params.id, user._id).then(() => {
				user.isGrantedAward = true;
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		}
	}

	showAllAttending() {
		this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'app/event/modal/event-participants.html',
	    	controller: 'EventParticipantsCtrl',
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