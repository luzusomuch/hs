'use strict';

class JoinedEventsCtrl {
	constructor($scope, $localStorage, EventService) {
		$scope.friendsEvents = [];
		EventService.getFriendsEvents().then(resp => {
			$scope.friendsEvents = resp.data.events;
		}).catch(err => {
			console.log(err);
		});
	}
}

angular.module('healthStarsApp').directive('hsJoinedEvents', () => {
	return {
		restrict: 'E',
		controller: 'JoinedEventsCtrl',
		templateUrl: 'app/event/joined-events/view.html'
	};
}).controller('JoinedEventsCtrl', JoinedEventsCtrl);