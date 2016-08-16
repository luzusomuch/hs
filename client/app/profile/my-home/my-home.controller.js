'use strict';

class MyHomeCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, PhotoViewer, User) {
		this.User = User;
		this.dashboardItems = {
			page: 1
		};
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

		this.loadItems();
	}

	loadItems() {
		this.User.myDashboard({page: this.dashboardItems.page}).then(resp => {
			this.dashboardItems.items = (this.dashboardItems.items) ? this.dashboardItems.items.concat(resp.data.items) : resp.data.items;
			this.dashboardItems.totalItem = resp.data.totalItem;
			this.dashboardItems.page +=1;
			console.log(this.dashboardItems);
		});
	}

	viewPhoto(photo) {
		this.PhotoViewer.setPhoto(photo, {});
		this.PhotoViewer.toggle(true);
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);