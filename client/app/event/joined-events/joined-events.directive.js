'use strict';

class JoinedEventsCtrl {
	constructor($scope, $rootScope, EventService, SearchParams, $state, $localStorage) {
		$scope.authUser = $localStorage.authUser;
		$scope.SearchParams = SearchParams.params;
		$scope.friendsEvents = {};
		$scope.searchItems = {};
		$scope.page = 1;
		$scope.searchPage = 1;
		$scope.search = false;
		$scope.refresh = false;

		let refreshMyUpcomingEvents = $rootScope.$on('refreshMyUpcomingEvents', () => {
			$scope.page = 1;
			$scope.refresh = true;
			$scope.loadMore();
		});

		$scope.$on('$destroy', function () {
      refreshMyUpcomingEvents();
    });

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
				if ($scope.refresh) {
					$scope.search = false;
				}
				if ($scope.search) {
					$scope.searchItems.items = resp.data.items;
					$scope.searchItems.totalItem = resp.data.totalItem;
					if ($scope.searchItems.items.length < $scope.searchItems.totalItem) {
						$scope.searchPage += 1;
					}
				} else {
					if ($scope.page === 1) {
						$scope.friendsEvents.items = resp.data.items;
					} else {
						$scope.friendsEvents.items = $scope.friendsEvents.items.concat(resp.data.items);
					}
					$scope.friendsEvents.totalItem = resp.data.totalItem;
					$scope.page +=1;
				}
				$scope.refresh = false;
			});
		};

		$scope.loadMore();

		$scope.openEventDetail = function(event) {
			if (event.type==='local') {
				$state.go('event.detail', {id: event._id});
			} else {
				let link = (event.type==='google') ? event.google.htmlLink : 'https://www.facebook.com/events/'+event.facebook.id;
				window.open(link, '_blank');
			}
		};

		$scope.checkParticipants = function(participants, owner) {
			let data = (participants && participants.length > 0) ? angular.copy(participants) : [];
	    data.push(owner);
	    return _.findIndex(data, (item) => {
	    	return item._id.toString()===$scope.authUser._id.toString();
	    }) !== -1;
		};
	}
}

angular.module('healthStarsApp').directive('hsJoinedEvents', () => {
	return {
		restrict: 'E',
		controller: 'JoinedEventsCtrl',
		templateUrl: 'app/event/joined-events/view.html'
	};
}).controller('JoinedEventsCtrl', JoinedEventsCtrl);