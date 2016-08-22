'use strict';

class MyMessagesCtrl {
	constructor($localStorage, $state, ThreadService) {
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.threads = {
			page: 1,
			pageSize: 5
		};
		this.currentPage = 1;
		this.getItems();
	}

	getItems() {
		this.ThreadService.getMyMessages({page: this.threads.page, pageSize: this.threads.pageSize}).then(resp => {
			this.threads.items = resp.data.items;
			this.threads.totalItem = resp.data.totalItem;
		});
	}

	search(searchTerm) {
		console.log(searchTerm);
	}
}

angular.module('healthStarsApp').controller('MyMessagesCtrl', MyMessagesCtrl);