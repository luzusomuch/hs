'use strict';

class MyPhotosCtrl {
	constructor($localStorage, APP_CONFIG, PhotoViewer, user, growl) {
		this.growl = growl;
		this.user = user;
		this.authUser = $localStorage.authUser;
		this.user.link = APP_CONFIG.baseUrl + 'profile/' + this.user._id +'/detail';
		this.PhotoViewer = PhotoViewer;

		this.photos = {
			page: 1
		};

		this.loadPhotos();
	}

	loadPhotos() {
		this.PhotoViewer.myPhotos({pageSize: 20, userId: this.user._id}).then(resp => {
			this.photos.items = (this.photos.items) ? this.photos.items.concat(resp.data.items) : resp.data.items;
			this.photos.totalItem = resp.data.totalItem;
			this.photos.page += 1;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	delete(photo) {
		if (photo.ownerId===this.authUser._id) {
			this.PhotoViewer.delete(photo._id).then(() => {
				let index = _.findIndex(this.photos.items, (item) => {
					return item._id===photo._id;
				});
				if (index) {
					this.photos.items.splice(index, 1);
				}
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		}
	}

	viewPhoto(photo) {
		this.PhotoViewer.setPhoto(photo, {});
		this.PhotoViewer.toggle(true);
	}
}

angular.module('healthStarsApp').controller('MyPhotosCtrl', MyPhotosCtrl);