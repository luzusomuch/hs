'use strict';

class JoinedEventsCtrl {
	constructor($scope, EventService, SearchParams) {
		$scope.SearchParams = SearchParams.params;
		$scope.friendsEvents = {};
		$scope.searchItems = {};
		$scope.page = 1;
		$scope.searchPage = 1;
		$scope.search = false;

		$scope.$watch('SearchParams', (nv) => {
			if (nv && nv.dates.length > 0) {
				$scope.search = true;
				$scope.loadMore(true);
			} else {
				$scope.searchPage = 1;
				$scope.search = false;
				$scope.searchItems = {};
			}
		}, true);

		$scope.loadMore = () => {
			let params = {};
			if ($scope.search) {
				params.dates = $scope.SearchParams.dates;
				params.page = $scope.searchPage;
			} else {
				params.page = $scope.page;
			}
			EventService.myUpcomingEvents(params).then(resp => {
				if ($scope.search) {
					$scope.searchItems.items = resp.data.items;
					$scope.searchItems.totalItem = resp.data.totalItem;
					if ($scope.searchItems.items.length < $scope.searchItems.totalItem) {
						$scope.searchPage += 1;
					}
				} else {
					$scope.page +=1;
					$scope.friendsEvents.items = ($scope.friendsEvents.items) ? $scope.friendsEvents.items.concat(resp.data.items) : resp.data.items;
					$scope.friendsEvents.totalItem = resp.data.totalItem;
				}
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