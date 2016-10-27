'use strict';

class PhotoViewerCtrl {
	constructor($scope, PhotoViewer) {
		this.photo = {
			detail: null,
			next: null,
			prev: null
		};
		this.viewer = PhotoViewer;
		$scope.$watch(() => {
			return this.viewer.isOpened();
		}, nv => {
			if(nv) {
				this.setPhoto(this.viewer.getPhoto());
			}
			this.isOpened = nv;
		});
	}

	setPhoto(photo) {
		this.photo.detail = photo;
		this.viewer.getFromServer().then(
			res => this.photo = res.data
		);
	}

	next() {
		if(!this.photo.next) {
			return false;
		}
		this.viewer.setPhoto(this.photo.next);
		this.setPhoto(this.photo.next);
	}

	prev() {
		if(!this.photo.prev) {
			return false;
		}
		this.viewer.setPhoto(this.photo.prev);
		this.setPhoto(this.photo.prev);
	}

	hasPhoto(key) {
		return !!this.photo[key];
	}

	close() {
		this.photo = {
			detail: null,
			next: null,
			prev: null
		};
		this.viewer.toggle();
	}
}

angular.module('healthStarsApp.photoViewer', ['healthStarsApp.constants', 'healthStarsApp.util']).config(function(){}).directive('hsPhotoViewer', () => {
	return {
		restrict: 'E',
		templateUrl: 'app/photo/photo.html',
		controller: 'PhotoViewerCtrl',
		controllerAs: 'vm'
	};
})
.factory('PhotoViewer', function($http, APP_CONFIG, Util) {
	var open = false, params = {}, photo = {}, config = APP_CONFIG;

	return {
		setPhoto: (p, queryParams) => {
			photo = p || {};
			queryParams = 'object' === typeof queryParams ? queryParams : {};
			params = Object.assign(params, {id: p._id }, queryParams);
		},

		getPhoto: () => {
			return photo;
		},

		isOpened: () => {
			return open;
		},

		toggle: (flag) => {
			if(flag && (!photo._id || !photo.metadata)) {
				return console.log('No photo to view');
			}
			open = !!flag;
		},
		getFromServer: () => {
			var query = Util.obToquery(params);
			return $http.get(`${config.baseUrl}api/${config.apiVer}/photos/view?${query}`);
		},
		blockPhoto(id, data) {
			return $http.put(`${config.baseUrl}api/${config.apiVer}/photos/${id}/block`, data);
		},
		myPhotos(params) {
			return $http.get(`${config.baseUrl}api/${config.apiVer}/photos/my-photos`, {params: params});	
		},
		delete(id) {
			return $http.delete(`${config.baseUrl}api/${config.apiVer}/photos/${id}`);	
		},
		deleteList(data) {
			return $http.post(`${config.baseUrl}api/${config.apiVer}/photos/delete-photos-list`, data);
		}
	};
})
.controller('PhotoViewerCtrl', PhotoViewerCtrl);