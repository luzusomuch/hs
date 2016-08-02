'use strict';

class BackendAwardListCtrl {
	constructor($scope, $uibModal, $http, AwardService) {
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
		this.searchText = {};
	}

	loadMore() {
		this.AwardService.getAll('null', {page: this.page}).then(resp => {
  		this.page += 1;
  		this.awards.items = (this.awards.items) ? this.awards.items.concat(resp.data.items) : resp.data.items;
  		this.awards.totalItem = resp.data.totalItem;
  		console.log(this.awards);
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	block(photo) {
		this.AwardService.block(photo._id).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	edit(award) {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/award/edit/edit.html',
    	controller: 'BackendEditAwardCtrl',
    	resolve: {
    		award: () => {
    			return award;
    		}
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
			}
		}, err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendAwardListCtrl', BackendAwardListCtrl)
