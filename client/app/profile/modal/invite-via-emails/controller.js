'use strict';

class InviteViaEmailsCtrl {
	constructor($uibModalInstance, growl) {
		this.growl = growl;
		this.$uibModalInstance = $uibModalInstance;
		this.emails = [];
	}

	validateEmail(email) {
		let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return regex.test(email);
	}

	add(email) {
		if (this.validateEmail(email)) {
			this.emails.push(email);
			this.email = null;
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	remove(index) {
		this.emails.splice(index, 1);
	}

	submit() {
		if (this.emails.length > 0) {
			this.$uibModalInstance.close(this.emails);
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('InviteViaEmailsCtrl', InviteViaEmailsCtrl);