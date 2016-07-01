'use strict';

class EventDetailCtrl {
	constructor($scope, event) {
		this.event = event;
	}
}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);