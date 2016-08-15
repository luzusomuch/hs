'use strict';

class MyHomeCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, PhotoViewer) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id +'/detail';
		this.$state = $state;
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4}).then(resp => {
			this.photos = resp.data;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});
	}

	viewPhoto(photo) {
		this.PhotoViewer.setPhoto(photo, {});
		this.PhotoViewer.toggle(true);
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);