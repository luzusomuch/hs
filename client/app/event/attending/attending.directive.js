'use strict';

class EventAttendingCtrl {
	constructor($scope, EventService) {
		this.participants = {};
		$scope.$watch('eId', (nv) => {
			if(nv) {
				EventService.getParticipants(nv).then(
					res => this.participants = res.data
				);
			}
		});
	}
}

angular.module('healthStarsApp').directive('hsEventAttending', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '='
		},
		templateUrl: 'app/event/attending/attending.html',
		controller: 'EventAttendingCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventAttendingCtrl', EventAttendingCtrl);