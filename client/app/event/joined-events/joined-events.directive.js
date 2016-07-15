'use strict';

class JoinedEventsCtrl {
	constructor($scope, $localStorage, EventService) {
		this.events = [];
		EventService.getFriendsEvents().then(resp => {
			this.events = resp.data.events;
		});
	}
}

angular.module('healthStarsApp').directive('hsJoinedEvents', ($uibModal) => {
	return {
		restrict: 'A',
		controller: 'JoinedEventsCtrl',
		controllerAs: 'vm',
		templateUrl: 'app/event/joined-events/view.html'
	};
}).controller('JoinedEventsCtrl', JoinedEventsCtrl);