'use strict';

class EventDetailCtrl {
	constructor($scope, event, $localStorage) {
		this.event = event;
		this.authUser = $localStorage.authUser;
		console.log(this.event);
	}

	isNotParticipant() {
		if(!this.event.participantsId) return true;
		return this.event.participantsId.indexOf(this.authUser._id) === -1;
	}

}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);