'use strict';

class BackendPhotoListCtrl {
	constructor($scope, $uibModal, $http, PhotoService) {
		this.page = 1;
		this.$http = $http;
		this.photos = {};
		this.PhotoService = PhotoService;
		this.loadMore();
		this.search = false;
	}

	loadMore() {
		this.PhotoService.getPhotos({page: this.page}).then(resp => {
  		this.page += 1;
  		this.photos.items = (this.photos.items) ? this.photos.items.concat(resp.data.items) : resp.data.items;
  		this.photos.totalItem = resp.data.totalItem;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}
}

function PhotoService($http, APP_CONFIG) {
  	return {
      block(id) {
        return $http.put('/api/v1/comments/'+id+'/block');
      },
  		getPhotos: (params) => {
  			return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/photos`, {params: params});
  		}
  	};
  }


angular.module('healthStarsApp')
	.controller('BackendPhotoListCtrl', BackendPhotoListCtrl)
	.factory('PhotoService', PhotoService);;