'use strict';

class MyHomeCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, PhotoViewer, User, RelationService, Invite) {
		this.RelationService = RelationService;
		this.Invite = Invite;
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

	friendAccept(item) {
		if (item.itemType==='relation') {
			this.RelationService.update(item._id, {status: 'completed'}).then(() => {
				let index = _.findIndex(this.dashboardItems.items, (data) => {
					return item._id===data._id;
				});
				if (index !== -1) {
					this.dashboardItems.items.splice(index, 1);
					this.dashboardItems.totalItem -= 1;
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}

	friendReject(item) {
		if (item.itemType==='relation') {
			this.RelationService.delete(item._id).then(() => {
				let index = _.findIndex(this.dashboardItems.items, (data) => {
					return item._id===data._id;
				});
				if (index !== -1) {
					this.dashboardItems.items.splice(index, 1);
					this.dashboardItems.totalItem -= 1;
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}

	eventAccept(item) {
		if (item.itemType==='event-invited' || item.inviteId) {
			this.Invite.acceptEventInvite(item.inviteId).then(() => {
				let index = _.findIndex(this.dashboardItems.items, (data) => {
					return item._id===data._id;
				});
				if (index !== -1) {
					this.dashboardItems.items.splice(index, 1);
					this.dashboardItems.totalItem -= 1;
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}

	eventReject(item) {
		if (item.itemType==='event-invited' || item.inviteId) {
			this.Invite.rejectEventInvite(item.inviteId).then(() => {
				let index = _.findIndex(this.dashboardItems.items, (data) => {
					return item._id===data._id;
				});
				if (index !== -1) {
					this.dashboardItems.items.splice(index, 1);
					this.dashboardItems.totalItem -= 1;
				}
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);