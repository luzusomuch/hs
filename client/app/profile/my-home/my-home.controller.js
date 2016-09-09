'use strict';

class MyHomeCtrl {
	constructor($scope, $localStorage, APP_CONFIG, PhotoViewer, User, RelationService, Invite, $http, growl, $uibModal) {
		this.$uibModal = $uibModal;
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
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		}
	}

	inviteFriend(type) {
		if (type==='google') {
			window.auth2.signIn().then(() => {
				window.gapi.client.plus.people.list({
				  	'userId' : 'me',
				  	'collection' : 'visible'
				}).execute(resp => {
					if (resp.error) {
						this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
					} else {
						_.each(resp.items, (item) => {
							if (item.objectType==='person') {
								window.gapi.client.plus.people.get({userId: item.id}).execute(profile => {
									console.log(profile);
								});
							}
						});
					}
				});
			});
		} else if (type==='outlook') {
			console.log(this.APP_CONFIG);
			WL.init({
		      	client_id: this.APP_CONFIG.apiKey.hotmailId,
		      	redirect_uri: this.APP_CONFIG.apiKey.hotmailCallbackUrl,
		      	scope: ['wl.basic', 'wl.contacts_emails'],
		      	response_type: 'token'
		    });
			WL.login().then(() => {
				WL.api({
		            path: 'me/contacts',
		            method: 'GET'
		        }).then(response => {
		            	console.log(response.data);
		            }, (resp) => {
		            	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		            }
		        );
			}, (resp) => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else if (type==='viaEmails') {
			this.$uibModal.open({
				animation: true,
				controller: 'InviteViaEmailsCtrl',
				controllerAs: 'InviteEmails',
				templateUrl: 'app/profile/modal/invite-via-emails/view.html'
			}).result.then(data => {
				this.RelationService.inviteViaEmails({emails: data}).then(() => {
					this.growl.success(`<p>{{'INVITE_FRIENDS_SUCCESSFULLY' | translate}}</p>`);
				}).catch(() => {
					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);	
				});
			});
		}
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);