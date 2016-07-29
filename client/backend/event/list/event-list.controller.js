'use strict';

class BackendEventListCtrl {
	constructor($scope, $localStorage, events, $uibModal, EventService) {
		this.events = events;
		console.log(this.events);
		this.$uibModal = $uibModal;
		this.EventService = EventService;
		this.page = 2;
		this.filterTypes = [
			{value: 'category', text: 'CATEGORY'},
			{value: 'owner', text: 'EVENT_OWNER'}
		];
		this.search = false;
		$scope.$watch('vm.searchText', (nv) => {
			if (nv && nv.trim().length > 0) {
				this.searchItems = [];
				this.search = true;
				_.each(this.events.items, (item) => {
					if (this.selectedFilterType === 'category') {
						if (item.categoryId.type.indexOf(nv) > -1) {
							let index = _.findIndex(this.searchItems, (event) => {
								return item._id===event._id;
							});
							if (index === -1) {
								this.searchItems.push(item);
							}
						}
					} else if (this.selectedFilterType==='owner') {
						if (item.ownerId.name.toLowerCase().indexOf(nv) > -1 || item.ownerId.name.indexOf(nv) > -1) {
							let index = _.findIndex(this.searchItems, (event) => {
								return item._id===event._id;
							});
							if (index === -1) {
								this.searchItems.push(item);
							}
						}
					} else {
						if (item.name.indexOf(nv) > -1) {
							let index = _.findIndex(this.searchItems, (event) => {
								return item._id===event._id;
							});
							if (index === -1) {
								this.searchItems.push(item);
							}
						}
					}
				});
			} else {
				this.search = false;
				this.searchItems = [];
			}
		});
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