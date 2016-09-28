'use strict';

class MyAwardCtrl {
	constructor(growl, User, $http, $scope, $state, $localStorage, $timeout, APP_CONFIG, grantedAwards, ownAwards, $uibModal, AwardService) {
		this.growl = growl;
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
		this.authUser = $localStorage.authUser;

		// check current user exhibit rank
		if (!this.authUser.awardsExhibits || this.authUser.awardsExhibits.length === 0) {
			this.authUser.awardsExhibits = [
				{number: 1, awardId: {}},
				{number: 3, awardId: {}},
				{number: 2, awardId: {}},
			];
		} else if (this.authUser.awardsExhibits.length === 1) {
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
	    	controllerAs: 'vm',
	    	resolve: {
	    		friends: ['RelationService', (RelationService) => {
	    			return RelationService.getAll({id: this.authUser._id, type: 'friend'}, {showAll: true}).then(resp => {
	    				return resp.data.items;
	    			});
	    		}]
	    	}
	    });
		modalInstance.result.then(data => {
			this.ownAwardLoaded = false;
			this.ownAwards.items.push(data);

			this.$timeout(() => {
				this.ownAwardLoaded = true;
			});
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
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		}
	}

	showOwnAwards() {
		let result = false;
		if (this.authUser.role==='admin') {
			result = true;
		} else if (this.authUser.isCompanyAccount) {
			result = true;
		}
		return result;
	}

	viewAward(award) {
		this.$uibModal.open({
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

		// find out current changing award position
		let idx = _.findIndex(this.authUser.awardsExhibits, (a) => {
			return a.number===rank;
		});
		if (idx !== -1) {
			let tmpAward = angular.copy(this.authUser.awardsExhibits[idx].awardId);
			// replace new award to exhibit 
			this.authUser.awardsExhibits[idx].awardId = (award.awardId) ? award.awardId : award;
			// If its switch between exhibit awards
			if (award.number) {
				let replaceIdx = _.findIndex(this.authUser.awardsExhibits, (aw) => {
					return aw.number === award.number;
				});
				if (replaceIdx !== -1) {
					this.authUser.awardsExhibits[replaceIdx].awardId = tmpAward;
					data.swapAwardId = this.authUser.awardsExhibits[replaceIdx].awardId._id;
					data.swapRank = this.authUser.awardsExhibits[replaceIdx].number;
				}
			}
		}

		this.User.changeExhibit(data).then(resp => {
			this.$localStorage.authUser = resp.data;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	editAward(award) {
		let modalInstance = this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'app/award/edit/edit.html',
	    	controller: 'EditAwardCtrl',
	    	resolve: {
	    		award: ['AwardService', (AwardService) => {
	    			return AwardService.get(award._id).then(resp => {
	    				return resp.data;
	    			});
	    		}],
	    		friends: ['RelationService', (RelationService) => {
	    			return RelationService.getAll({id: this.authUser._id, type: 'friend'}, {showAll: true}).then(resp => {
	    				return resp.data.items;
	    			});
	    		}]
	    	}
	    });
		modalInstance.result.then(data => {
			this.ownAwardLoaded = false;
			let index = _.findIndex(this.ownAwards.items, (award) => {
				return award._id===data._id;
			});
			if (index !== -1) {
				this.ownAwards.items[index] = data;
				this.$timeout(() => {
					this.ownAwardLoaded = true;
				});
			}
		});
	}
}

angular.module('healthStarsApp').controller('MyAwardCtrl', MyAwardCtrl);