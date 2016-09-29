'use strict';

class BackendCompanyAccountRequestListCtrl {
	constructor($scope, CompanyAccountRequestService, growl) {
		this.sortReverse = false;
		this.sortType = 'createdAt';
		this.growl = growl;
		this.CompanyAccountRequestService = CompanyAccountRequestService;
		this.requests = {
			page: 1
		};

		this.getRequest();
	}

	getRequest() {
		this.CompanyAccountRequestService.list({page: this.requests.page}).then(resp => {
			this.requests.page += 1;
			this.requests.totalItem = resp.data.totalItem;
			this.requests.items = (this.requests.items) ? this.requests.items.concat(resp.data.items) : resp.data.items;
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendCompanyAccountRequestListCtrl', BackendCompanyAccountRequestListCtrl);
