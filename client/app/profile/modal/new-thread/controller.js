'use strict';

class NewThreadCtrl {
	constructor(friends, $uibModalInstance, $localStorage, growl) {
		this.growl = growl;
		this.$uibModalInstance = $uibModalInstance;
		this.authUser = $localStorage.authUser;
		friends.unshift({name: ' '});
		this.friends = friends;

		this.submitted = false;
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid) {
			this.$uibModalInstance.close({toUsers: _.map(this.toUsers, '_id'), message: this.message});
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('NewThreadCtrl', NewThreadCtrl);