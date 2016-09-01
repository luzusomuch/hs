class EventParticipantsCtrl {
	constructor($scope, $uibModalInstance, $state, EventService, $localStorage, onlineUsers, RelationService, growl) {
		$scope.authUser = $localStorage.authUser;
		$scope.participants = {
			pageSize: 20
		};

		$scope.getParticipants = () => {
			EventService.getParticipants($state.params.id, {pageSize: $scope.participants.pageSize}).then(resp => {
				$scope.participants.items = resp.data.items;
				$scope.participants.totalItem = resp.data.totalItem;
				$scope.participants.pageSize += 20;

				// Tracking online/offline user
				_.each($scope.participants.items, (friend) => {
	     			friend.online = false;
	     			let index = _.findIndex(onlineUsers, (item) => {
	     				return item===friend._id;
	     			});
	     			if (index !== -1) {
	     				friend.online = true;
	     			}
	     		});
			});
		};

		$scope.getParticipants();

		$scope.close = () => {
			$uibModalInstance.dismiss();
		};

		$scope.addFriend = (friend) => {
			RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
	    		friend.friendStatus = resp.data.type;
			}).catch(() => {
				growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		};
	}
}

angular.module('healthStarsApp').controller('EventParticipantsCtrl', EventParticipantsCtrl);