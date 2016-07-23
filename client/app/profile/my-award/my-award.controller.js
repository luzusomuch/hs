'use strict';

class MyAwardCtrl {
	constructor(User, $http, $scope, $state, $localStorage, $timeout, APP_CONFIG, grantedAwards, ownAwards, $uibModal, AwardService) {
		this.errors = {};
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
		this.User = User;
		this.$localStorage = $localStorage;
		this.authUser = this.$localStorage.authUser;

		// check current user exhibit rank
		if (this.authUser.awardsExhibits.length === 1) {
			switch (this.authUser.awardsExhibits[0].number) {
				case 1:
					this.authUser.awardsExhibits.push({number: 2, awardId: {}});
					this.authUser.awardsExhibits.push({number: 3, awardId: {}});
					break;
				case 2:
					this.authUser.awardsExhibits.push({number: 1, awardId: {}});
					this.authUser.awardsExhibits.push({number: 3, awardId: {}});
					break;
				case 3:
					this.authUser.awardsExhibits.push({number: 1, awardId: {}});
					this.authUser.awardsExhibits.push({number: 2, awardId: {}});
					break;
				default:
					break;
			}
		} else if (this.authUser.awardsExhibits.length === 2) {
			if (this.authUser.awardsExhibits[0].number===1 && this.authUser.awardsExhibits[1].number===2) {
				this.authUser.awardsExhibits.push({number: 3, awardId: {}});
			} else if (this.authUser.awardsExhibits[0].number===1 && this.authUser.awardsExhibits[1].number===3) {
				this.authUser.awardsExhibits.push({number: 2, awardId: {}});
			} else if (this.authUser.awardsExhibits[0].number===2 && this.authUser.awardsExhibits[1].number===3) {
				this.authUser.awardsExhibits.push({number: 1, awardId: {}});
			}
		}
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

	dropData(award, event, rank) {
		let data = {
			rank: rank
		};
		if (award.awardId) {
			data.awardId = award.awardId._id;
		} else {
			data.awardId = award._id;
		}

		this.User.changeExhibit(data).then(resp => {
			this.$localStorage.authUser = resp.data;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp').controller('MyAwardCtrl', MyAwardCtrl);