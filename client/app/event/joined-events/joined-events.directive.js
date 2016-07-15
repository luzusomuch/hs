'use strict';

class JoinedEventsCtrl {
	constructor($scope, $localStorage, EventService) {
		this.events = [];
		EventService.getFriendsEvents().then(resp => {
			this.events = resp.data.events;
			console.log(this.events);
		}).catch(err => {
			console.log(err);
		});
	}
}

angular.module('healthStarsApp').directive('hsJoinedEvents', () => {
	return {
		restrict: 'E',
		controller: 'JoinedEventsCtrl',
		controllerAs: 'vm',
		templateUrl: 'app/event/joined-events/view.html'
	};
}).controller('JoinedEventsCtrl', JoinedEventsCtrl);