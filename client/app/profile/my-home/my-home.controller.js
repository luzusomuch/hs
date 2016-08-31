'use strict';

class MyHomeCtrl {
	constructor($scope, $localStorage, APP_CONFIG, PhotoViewer, User, RelationService, Invite, $http, $timeout, growl) {
		this.growl = growl;
		this.$http = $http;
		this.RelationService = RelationService;
		this.APP_CONFIG = APP_CONFIG;
		this.Invite = Invite;
		this.User = User;
		this.dashboardItems = {
			page: 1
		};
		this.authUser = $localStorage.authUser;
		this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id +'/detail';
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4}).then(resp => {
			this.photos = resp.data;
		});

		this.loadItems();

		$timeout(() => {
			gapi.load('auth2', () => {
				this.auth2 = gapi.auth2.init({
					client_id: APP_CONFIG.apiKey.ggAppId,
					fetch_basic_profile: true,
					scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/user.emails.read https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly'
				});
			});
			gapi.load('client', () => {
				gapi.client.load('plus', 'v1');
			});

			WL.init({
			    client_id: APP_CONFIG.apiKey.hotmailId,
			    redirect_uri: APP_CONFIG.apiKey.hotmailCallbackUrl,
			    scope: ["wl.basic", "wl.contacts_emails"],
			    response_type: "token"
			});
		}, 1000);
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
			}).catch(() => {
				this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			});
		} else {
			this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
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
			}).catch(() => {
				this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			});
		} else {
			this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
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
			}).catch(() => {
				this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			});
		} else {
			this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
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
			}).catch(() => {
				this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			});
		} else {
			this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
		}
	}

	inviteFriend(type) {
		if (type==='google') {
			this.auth2.signIn().then(resp => {
				gapi.client.plus.people.list({
				  	'userId' : 'me',
				  	'collection' : 'visible'
				}).execute(resp => {
					if (resp.error) {
						this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
					} else {
						_.each(resp.items, (item) => {
							if (item.objectType==='person') {
								gapi.client.plus.people.get({userId: item.id}).execute(profile => {
									console.log(profile)
								});
							}
						});
					}
				});
			});
		} else if (type==='outlook') {
			WL.login().then(resp => {
				console.log(resp);
				WL.api({
		            path: "me/contacts",
		            method: "GET"
		        }).then(
		            function (response) {
		            	console.log(response.data);
		            },
		            function (responseFailed) {
		            	this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
		            }
		        );
			}, responseFailed => {
				this.growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			});
		}
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);