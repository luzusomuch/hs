'use strict';

class JoinedEventsCtrl {
	constructor($scope, EventService) {
		$scope.friendsEvents = {};
		$scope.page = 1;

		$scope.loadMore = () => {
			EventService.getFriendsEvents({page: $scope.page}).then(resp => {
				$scope.friendsEvents.items = ($scope.friendsEvents.items) ? $scope.friendsEvents.items.concat(resp.data.items) : resp.data.items;
				$scope.friendsEvents.totalItem = resp.data.totalItem;
				$scope.page +=1;
			}).catch(err => {
				console.log(err);
			});
		};

		$scope.loadMore();
	}
}

angular.module('healthStarsApp').directive('hsJoinedEvents', () => {
	return {
		restrict: 'E',
		controller: 'JoinedEventsCtrl',
		templateUrl: 'app/event/joined-events/view.html'
	};
}).controller('JoinedEventsCtrl', JoinedEventsCtrl);