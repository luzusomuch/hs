'use strict';

class EventDetailCtrl {
	constructor(event) {
		this.event = event;
	}
}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);