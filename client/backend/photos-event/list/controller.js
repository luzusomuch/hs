'use strict';

class BackendPhotosEventListCtrl {
	constructor($scope, $http, PhotoService, growl) {
		this.growl = growl;
		this.page = 1;
		this.$http = $http;
		this.photos = {};
		this.PhotoService = PhotoService;
		this.loadMore();
	}

	loadMore() {
		this.PhotoService.getPhotosEvent().then(resp => {
			this.page += 1;
  		this.photos.items = (this.photos.items) ? this.photos.items.concat(resp.data.items) : resp.data.items;
  		this.photos.totalItem = resp.data.totalItem;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendPhotosEventListCtrl', BackendPhotosEventListCtrl);