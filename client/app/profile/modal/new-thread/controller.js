'use strict';

class NewThreadCtrl {
	constructor($uibModalInstance, $localStorage, friends) {
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
			// TODO show error
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('NewThreadCtrl', NewThreadCtrl);