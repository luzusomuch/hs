class AddAwardCtrl {
	constructor($uibModalInstance, growl, awards, selectedAward, $uibModal) {
		this.awards = awards.data.items;
		if (selectedAward) {
			let index = _.findIndex(this.awards, (award) => {
				return award._id===selectedAward._id;
			});
			if (index !== -1) {
				this.awards[index].select = true;
			}
		}
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
		this.$uibModal = $uibModal;
	}

	showAddMoreAwardModal() {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/award/create/create-award-modal.html',
    	controller: 'CreateAwardCtrl',
    	controllerAs: 'vm'
    });
		modalInstance.result.then(data => {
			this.awards.push(data);
		}, err => {
			console.log(err);
		});
	}

	selectAward(award) {
		this.awards.forEach(aw => {
			aw.select = false;
		});
		award.select = true;
	}

	submit() {
		let selectedAward = _.filter(this.awards, {select: true});
		if (selectedAward.length > 0) {
			this.$uibModalInstance.close(selectedAward[0]);
		} else {
			this.growl.error('Please select an award');
		}
	}
}

angular.module('healthStarsApp').controller('AddAwardCtrl', AddAwardCtrl);