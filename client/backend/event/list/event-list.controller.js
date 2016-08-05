'use strict';

class BackendEventListCtrl {
	constructor($scope, $localStorage, events, $uibModal, EventService) {
		this.showActiveEvent = false;
		this.sortType = 'startDateTime';
		this.sortReverse = false;
		this.events = events;
		this.$uibModal = $uibModal;
		this.EventService = EventService;
		this.page = 2;
		this.filterTypes = [
			{value: 'category', text: 'CATEGORY'},
			{value: 'owner', text: 'EVENT_OWNER'},
			{value: 'name', text: 'EVENT_NAME'}
		];
		this.search = false;
		this.selectedFilterType = this.filterTypes[2].value;
		$scope.$watchGroup(['vm.searchText', 'vm.selectedFilterType'], (nv) => {
			if (nv && (nv[0] && nv[0].trim().length > 0) && nv[1]) {
				this.searchItems = [];
				this.search = true;
				_.each(this.events.items, (item) => {
					if (nv[1] === 'category') {
						if (item.categoryId.type === 'internation') {
							item.categoryId.type = 'sport';
						}
						if (item.categoryId.type.indexOf(nv[0]) > -1) {
							let index = _.findIndex(this.searchItems, (event) => {
								return item._id===event._id;
							});
							if (index === -1) {
								this.searchItems.push(item);
							}
						}
					} else if (nv[1]==='owner') {
						if (item.ownerId.name.toLowerCase().indexOf(nv[0]) > -1 || item.ownerId.name.indexOf(nv[0]) > -1) {
							let index = _.findIndex(this.searchItems, (event) => {
								return item._id===event._id;
							});
							if (index === -1) {
								this.searchItems.push(item);
							}
						}
					} else {
						if (item.name.indexOf(nv[0]) > -1) {
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

	loadMore() {
		this.EventService.search({page: this.page}).then(resp => {
  		this.page += 1;
  		this.events.items = this.events.items.concat(resp.data.items);
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	delete(event) {
		this.EventService.delete(event._id).then(() => {
			event.blocked = true;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp').controller('BackendEventListCtrl', BackendEventListCtrl);