'use strict';

class MyHomeCtrl {
	constructor($scope, $localStorage, APP_CONFIG, PhotoViewer, User, RelationService, Invite, $http, $timeout, SocialService, adalAuthenticationService) {
		this.$http = $http;
		this.RelationService = RelationService;
		this.APP_CONFIG = APP_CONFIG;
		this.Invite = Invite;
		this.User = User;
		this.SocialService = SocialService;
		this.dashboardItems = {
			page: 1
		};
		this.adalAuthenticationService = adalAuthenticationService;
		this.authUser = $localStorage.authUser;
		this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id +'/detail';
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4}).then(resp => {
			this.photos = resp.data;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});

		this.loadItems();

		$timeout(() => {
			gapi.load('auth2', () => {
				this.auth2 = gapi.auth2.init({
					client_id: APP_CONFIG.apiKey.ggAppId,
					fetch_basic_profile: false,
					scope: 'profile'
				});
			});
			gapi.load('client', () => {
				gapi.client.setApiKey(this.APP_CONFIG.apiKey.google);
				gapi.client.load('plus', 'v1');
			});
		}, 1000);
		console.log(adalAuthenticationService);
	}

	loadItems() {
		this.User.myDashboard({page: this.dashboardItems.page}).then(resp => {
			this.dashboardItems.items = (this.dashboardItems.items) ? this.dashboardItems.items.concat(resp.data.items) : resp.data.items;
			this.dashboardItems.totalItem = resp.data.totalItem;
			this.dashboardItems.page +=1;
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

	inviteFriend(type) {
		if (type==='google') {
			this.auth2.signIn().then(resp => {
				console.log(gapi.client.plus.people);
				var request = gapi.client.plus.people.list({
				  'userId' : 'me',
				  'collection' : 'connected'
				});

				request.execute(function(resp) {
					console.log(resp);
					if (resp.error) {
						// TODO show error
					}
				  	var numItems = resp.items.length;
				  	for (var i = 0; i < numItems; i++) {
				    	console.log(resp.items[i].displayName);
				  	}
				});
				// console.log(resp);
				// let userId = this.auth2.currentUser.get().getId();
				// this.SocialService.getGoogleContacts(userId, 'visible', this.APP_CONFIG.apiKey.google).then(resp => {
				// 	console.log(resp);
				// }).catch(err => {
				// 	console.log(err);
				// });
			});
		} else if (type==='outlook') {
			this.SocialService.getContacts().then(resp => {
				console.log(resp);
			}).catch(err => {
				console.log(err);
				if (err==='User login is required') {
					this.adalAuthenticationService.login();
				}
			});
		}
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);