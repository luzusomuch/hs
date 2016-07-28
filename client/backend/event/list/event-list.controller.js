'use strict';

class BackendEventListCtrl {
	constructor($scope, $localStorage, events, $uibModal, EventService) {
		this.events = events;
		console.log(this.events);
		this.$uibModal = $uibModal;
		this.EventService = EventService;
		this.page = 2;
	}

	edit(event) {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/category/edit/edit.html',
    	controller: 'BackendEditCategoryCtrl',
    	resolve: {
    		category: () => {
    			return cat;
    		}
    	}
    });
		modalInstance.result.then(data => {
			
		}, err => {
			console.log(err);
			// TODO show error
		});
	}

	loadMore() {
		this.EventService.search({page: this.page}).then(resp => {
  		this.page += 1;
  		this.events.items = this.events.items.concat(resp.data.items);
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp').controller('BackendEventListCtrl', BackendEventListCtrl);