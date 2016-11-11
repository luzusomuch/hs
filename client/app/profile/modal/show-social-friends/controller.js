'use strict';

class ShowSocialFriendsCtrl {
	constructor(friends, type, $uibModalInstance, $localStorage, growl) {
		this.growl = growl;
		this.$uibModalInstance = $uibModalInstance;
		this.authUser = $localStorage.authUser;
		this.friends = friends;
		this.type = type;

		this.submitted = false;
	}

	submit() {
		this.submitted = true;
		this.$uibModalInstance.dismiss();
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('ShowSocialFriendsCtrl', ShowSocialFriendsCtrl);