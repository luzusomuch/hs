'use strict';

class DeclineWholeRepeatingEventCtrl {
	constructor(EventService, eventId, $uibModalInstance, growl) {
		this.EventService = EventService;
		this.eventId = eventId;
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
	}

	submit(type) {
		if (type==='current-event') {
			this.$uibModalInstance.close();
		} else {
			this.EventService.declineWholeRepeatingEvent(this.eventId).then(() => {
				this.$uibModalInstance.close();
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('DeclineWholeRepeatingEventCtrl', DeclineWholeRepeatingEventCtrl);