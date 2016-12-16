'use strict';

class EventAttendingCtrl {
	constructor($scope, $rootScope, EventService, $state, $localStorage, $uibModal, RelationService, growl) {
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
		this.$rootScope = $rootScope;
		this.$scope = $scope;

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

		$rootScope.$watch('onlineUsers', nv => {
			$scope.onlineUsers = nv;
		});

	  $scope.$watchGroup(['onlineUsers', 'vm.participants.items'], (nv) => {
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

		this.isEventOwner = (($scope.eOwner && this.authUser._id===$scope.eOwner._id) || ($scope.eAdmin && this.authUser._id===$scope.eAdmin._id)) ? true : false;
	}

	banUser(user) {
		if (this.isEventOwner) {
			this.EventService.banUser(this.$state.params.id, user._id).then(() => {
				this.$rootScope.$emit('event-update-participants');
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

angular.module('healthStarsApp').directive('hsEventAttending', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '=',
			eOwner: '=',
			eAward: '=',
			eAdmin: '='
		},
		templateUrl: 'app/event/attending/attending.html',
		controller: 'EventAttendingCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventAttendingCtrl', EventAttendingCtrl);