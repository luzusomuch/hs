'use strict';

class EventRelatedCtrl {
	constructor($scope, EventService) {
		this.events = [];
		$scope.$watch('eId', nv => {
			if(nv) {
				EventService.getRelatedEvents(nv).then(
					res => this.events = res.data
				);
			}
		});
	}
}

angular.module('healthStarsApp').directive('hsRelatedEvents', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '='
		},
		templateUrl: 'app/event/related/related.html',
		controller: 'EventRelatedCtrl',
		controllerAs: 'vm',
		replace: true
	};
}).controller('EventRelatedCtrl', EventRelatedCtrl);