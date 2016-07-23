'use strict';

class MyAwardCtrl {
	constructor($http, $scope, $state, $localStorage, $timeout, APP_CONFIG, grantedAwards, ownAwards, $uibModal, AwardService) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.$uibModal = $uibModal;
		this.ownAwards = ownAwards;
		this.grantedAwards = grantedAwards;
		this.AwardService = AwardService;
		this.$timeout = $timeout;
		this.ownAwardLoaded = true;
		this.grantedAwardLoaded = true;
		this.$http = $http;
		this.APP_CONFIG = APP_CONFIG;
	}

	showAddMoreAwardModal() {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/award/create/create-award-modal.html',
    	controller: 'CreateAwardCtrl',
    	controllerAs: 'vm'
    });
		modalInstance.result.then(data => {
			this.ownAwardLoaded = false;
			this.ownAwards.items.push(data);

			this.$timeout(() => {
				this.ownAwardLoaded = true;
			});
		}, err => {
			console.log(err);
			// TODO show error
		});
	}

	delete(award, type) {
		if (type==='owner') {
			this.AwardService.delete(award._id).then(() => {
				this.ownAwardLoaded = false;
				let index = _.findIndex(this.ownAwards.items, (item) => {
					return item._id===award._id;
				});
				if (index !== -1) {
					this.ownAwards.items.splice(index, 1);
					this.$timeout(() => {
						this.ownAwardLoaded = true;
					});
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			this.$http.delete(this.APP_CONFIG.baseUrl+'api/'+this.APP_CONFIG.apiVer+'/grantAwards/'+award._id).then(() => {
				this.grantedAwardLoaded = false;
				let index = _.findIndex(this.grantedAwards.items, (item) => {
					return item._id===award._id;
				});
				if (index !== -1) {
					this.grantedAwards.items.splice(index, 1);
					this.$timeout(() => {
						this.grantedAwardLoaded = true;
					});
				}
			}).catch(err => {
				console.log(err);
			});
		}
	}

	viewAward(award) {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/award/detail/detail.html',
    	controller: 'AwardDetailCtrl',
    	resolve: {
    		award: () => {
    			return award;
    		}
    	}
    });
	}
}

angular.module('healthStarsApp').controller('MyAwardCtrl', MyAwardCtrl);