'use strict';

class BackendPhotoListCtrl {
	constructor($scope, $uibModal, $http, PhotoService, growl) {
		this.growl = growl;
		this.page = 1;
		this.$http = $http;
		this.photos = {};
		this.PhotoService = PhotoService;
		this.showBlockedPhotos = false;
		this.filterTypes = [{value: 'ownerId.name', text: 'OWNER'}, {value: 'event.name', text: 'EVENT'}];
		this.selectedFilterType = this.filterTypes[0].value;
		this.sortType = 'createdAt';
		this.sortReverse = false;
		this.loadMore();
		this.search = {};
		this.searching = false;

		$scope.$watchGroup(['vm.showBlockedPhotos', 'vm.selectedFilterType', 'vm.searchText'], (nv) => {
			if (nv[0] && nv[2] && nv[2].trim().length > 0) {
				this.searching = true;
				this.searchFn({blocked: true, type: nv[1], searchQuery: nv[2]});
			} else if (nv[0]) {
				this.searching = true;
				this.searchFn({blocked: true});
			} else if (nv[2] && nv[2].trim().length > 0) {
				this.searching = true;
				this.searchFn({type: nv[1], searchQuery: nv[2]});
			} else {
				this.searching = false;
			}
		});
	}

	searchFn(params) {
		this.PhotoService.search(params).then(resp => {
	  		this.search.items = resp.data.items;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	loadMore() {
		this.PhotoService.getPhotos({page: this.page}).then(resp => {
			this.page += 1;
	  		this.photos.items = (this.photos.items) ? this.photos.items.concat(resp.data.items) : resp.data.items;
	  		this.photos.totalItem = resp.data.totalItem;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	block(photo) {
		this.PhotoService.block(photo._id).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}
}

function PhotoService($http, APP_CONFIG) {
  	return {
      	block(id) {
        	return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/photos/${id}/block`);
      	},
  		getPhotos: (params) => {
  			return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/photos`, {params: params});
  		},
		search(params) {
			return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/photos/search`, {params: params});	
		}
  	};
  }


angular.module('healthStarsApp')
	.controller('BackendPhotoListCtrl', BackendPhotoListCtrl)
	.factory('PhotoService', PhotoService);