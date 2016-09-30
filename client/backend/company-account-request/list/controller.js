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

	acceptRequest(request) {
		this.CompanyAccountRequestService.accept(request._id).then(resp => {
			let index = _.findIndex(this.requests.items, (item) => {
				return item._id.toString()===request._id.toString();
			});
			if (index !== -1) {
				this.requests.items.splice(index, 1);
				this.requests.totalItem -=1;
			}
			this.growl.success(`<p>{{'ACCEPT_REQUEST_SUCCESSFULLY' | translate}}</p>`);
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	rejectRequest(request) {
		this.CompanyAccountRequestService.reject(request._id).then(resp => {
			let index = _.findIndex(this.requests.items, (item) => {
				return item._id.toString()===request._id.toString();
			});
			if (index !== -1) {
				this.requests.items.splice(index, 1);
				this.requests.totalItem -=1;
			}
			this.growl.success(`<p>{{'REJECT_REQUEST_SUCCESSFULLY' | translate}}</p>`);
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendCompanyAccountRequestListCtrl', BackendCompanyAccountRequestListCtrl);
