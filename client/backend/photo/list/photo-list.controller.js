'use strict';

class BackendPhotoListCtrl {
	constructor($scope, $uibModal, $http, PhotoService) {
		this.page = 1;
		this.$http = $http;
		this.photos = {};
		this.PhotoService = PhotoService;
		this.showBlockedPhotos = false;
		this.filterTypes = [{value: 'ownerId.name', text: 'Owner'}, {value: 'event.name', text: 'Event'}];
		this.selectedFilterType = this.filterTypes[0].value;
		this.sortType = 'createdAt';
		this.sortReverse = false;
		this.loadMore();

		$scope.$watch('vm.photos.items', (nv) => {
			if (nv && nv.length > 0) {
				let nonBlockedPhotos = _.filter(nv, {blocked: false});
				if (nonBlockedPhotos.length <= 5 && nv.length < this.photos.totalItem) {
					this.loadMore();
				}
			}
		});
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

	block(photo) {
		this.PhotoService.block(photo._id).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(err => {
			console.log(err);
			// TODO show error
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
  		}
  	};
  }


angular.module('healthStarsApp')
	.controller('BackendPhotoListCtrl', BackendPhotoListCtrl)
	.factory('PhotoService', PhotoService);