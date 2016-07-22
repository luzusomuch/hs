'use strict';

class MyAwardCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, grantedAwards, ownAwards, $uibModal, AwardService) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.$uibModal = $uibModal;
		this.ownAwards = ownAwards;
		this.grantedAwards = grantedAwards;
		this.AwardService = AwardService;
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
			// TODO show error
		});
	}

	delete(award, type) {
		if (type==='owner') {
			this.AwardService.delete(award._id).then(() => {
				let index = _.findIndex(this.ownAwards.items, (item) => {
					return item._id===award._id;
				});
				if (index !== -1) {
					this.ownAwards.items.splice(index, 1);
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {

		}
	}
}

angular.module('healthStarsApp').controller('MyAwardCtrl', MyAwardCtrl);