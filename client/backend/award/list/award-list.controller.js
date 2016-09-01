'use strict';

class BackendAwardListCtrl {
	constructor($scope, $uibModal, $http, AwardService, growl) {
		this.growl = growl;
		this.page = 1;
		this.$uibModal = $uibModal;
		this.$http = $http;
		this.awards = {};
		this.AwardService = AwardService;
		this.loadMore();
		this.showBlockedAwards = false;
		this.filterTypes = [
			{value: 'objectName', text: 'Name'}, 
			{value: 'ownerId.name', text: 'Owner name'}, 
			{value: 'event.name', text: 'Event name'}
		];
		this.selectedFilterType = this.filterTypes[0].value;
		this.sortType = 'createdAt';
		this.sortReverse = false;
		this.searchItems = [];
		this.searching = false;

		$scope.$watchGroup(['vm.showBlockedAwards', 'vm.selectedFilterType', 'vm.searchText'], (nv) => {
			if (nv[0] && nv[2] && nv[2].trim().length > 0) {
				this.searching = true;
				this.search({blocked: true, type: nv[1], searchQuery: nv[2]});
			} else if (nv[0]) {
				this.searching = true;
				this.search({blocked: true});
			} else if (nv[2] && nv[2].trim().length > 0) {
				this.searching = true;
				this.search({type: nv[1], searchQuery: nv[2]});
			} else {
				this.searching = false;
			}
		});
	}

	search(params) {
		this.AwardService.search(params).then(resp => {
			this.searchItems = resp.data.items;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	loadMore() {
		this.AwardService.getAll('null', {page: this.page}).then(resp => {
	  		this.page += 1;
	  		this.awards.items = (this.awards.items) ? this.awards.items.concat(resp.data.items) : resp.data.items;
	  		this.awards.totalItem = resp.data.totalItem;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	block(award) {
		this.AwardService.delete(award._id).then(() => {
			award.deleted = true;
			this.growl.success(`<p>{{'BLOCKED_ITEM_SUCCESSFULLY' | translate}}</p>`);
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	edit(award) {
		let modalInstance = this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'backend/award/edit/edit.html',
	    	controller: 'BackendEditAwardCtrl',
	    	resolve: {
	    		award: ['AwardService', (AwardService) => {
	    			return AwardService.get(award._id).then(resp => {
	    				return resp.data;
	    			});
	    		}],
	    		friends: ['RelationService', (RelationService) => {
	    			return RelationService.getAll({id: award.ownerId._id, type: 'friend'}, {showAll: true}).then(resp => {
	    				return resp.data.items;
	    			});
	    		}]
	    	}
	    });
		modalInstance.result.then(data => {
			let index = _.findIndex(this.awards.items, (award) => {
				return award._id===data._id;
			});
			if (index !== -1) {
				data.event = award.event;
				data.ownerId = award.ownerId;
				this.awards.items[index] = data;
				this.growl.success(`<p>{{'UPDATE_AWARD_SUCCESSFULLY' | translate}}</p>`);
			}
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendAwardListCtrl', BackendAwardListCtrl);
