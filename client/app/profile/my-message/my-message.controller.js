'use strict';

class MyMessagesCtrl {
	constructor($scope, $localStorage, $state, ThreadService) {
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.threads = {
			page: 1,
			pageSize: 5
		};
		this.currentPage = 1;
		this.searchQuery = {};
		this.getItems();

		$scope.$watch('vm.searchTerm', (nv) => {
			if (!nv || (nv && nv.length===0)) {
				this.searchQuery.search = false;
			}
		});
	}

	getItems() {
		this.ThreadService.getMyMessages({page: this.threads.page, pageSize: this.threads.pageSize}).then(resp => {
			this.threads.items = resp.data.items;
			this.threads.totalItem = resp.data.totalItem;
		});
	}

	search(searchTerm) {
		if (searchTerm && searchTerm.trim().length > 0) {
			this.searchQuery.search = true;
			this.ThreadService.search({query: searchTerm}).then(resp => {
				this.searchQuery.items = resp.data.items;
			}).catch(err => {
				// TODO show error
				console.log(err);
			});
		}
	}
}

angular.module('healthStarsApp').controller('MyMessagesCtrl', MyMessagesCtrl);