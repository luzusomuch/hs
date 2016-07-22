'use strict';

class MyAwardCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, grantedAwards, ownAwards, $uibModal) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.$uibModal = $uibModal;
		console.log(grantedAwards);
		console.log(ownAwards);
		console.log(this.authUser);
		this.ownAwards = ownAwards;
	}

	showAddMoreAwardModal() {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/award/create/create-award-modal.html',
    	controller: 'CreateAwardCtrl',
    	controllerAs: 'vm'
    });
		modalInstance.result.then(data => {
			this.ownAwards.items.push(data);
		}, err => {
			console.log(err);
		});
	}
}

angular.module('healthStarsApp').controller('MyAwardCtrl', MyAwardCtrl);