'use strict';

class EventRelatedCtrl {
	constructor($scope, User) {
		this.events = [];
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