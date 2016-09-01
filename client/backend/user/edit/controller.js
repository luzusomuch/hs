'use strict';

class BackendEditUserCtrl {
	constructor($scope, user, $uibModalInstance, User, growl) {
		this.growl = growl;
		this.user = user;
		this.user.location = (user.location) ? user.location : {};
		this.$uibModalInstance = $uibModalInstance;
		this.User = User;
		this.submitted = false;
	}

	close() {
		this.$uibModalInstance.dismiss();
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid) {
			this.$uibModalInstance.close(this.user);
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}
}

angular.module('healthStarsApp')
	.controller('BackendEditUserCtrl', BackendEditUserCtrl);
