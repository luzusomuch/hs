'use strict';

class ShowSocialFriendsCtrl {
	constructor(friends, type, $uibModalInstance, $localStorage, growl) {
		this.growl = growl;
		this.$uibModalInstance = $uibModalInstance;
		this.authUser = $localStorage.authUser;
		this.friends = friends;
		this.type = type;
		console.log(this.friends);
		console.log(this.type);

		this.submitted = false;
	}

	submit(form) {
		this.submitted = true;

	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('ShowSocialFriendsCtrl', ShowSocialFriendsCtrl);