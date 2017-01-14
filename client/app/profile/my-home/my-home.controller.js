'use strict';

class MyHomeCtrl {
	constructor($scope, $rootScope, $localStorage, APP_CONFIG, PhotoViewer, User, RelationService, Invite, $http, growl, $uibModal, NotificationService) {
		this.$uibModal = $uibModal;
		this.growl = growl;
		this.$http = $http;
		this.RelationService = RelationService;
		this.APP_CONFIG = APP_CONFIG;
		this.Invite = Invite;
		this.User = User;
		this.dashboardItems = {
			page: 1,
			limitTo: 10
		};
		this.authUser = $localStorage.authUser;
		this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id +'/detail';
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4}).then(resp => {
			this.photos = resp.data;
		});

		// mark all notifications as read
		NotificationService.markAllAsRead().then(() => {
			$rootScope.$emit('mark-all-notification-as-read');
		});

		this.eventTypes = ['attend-event', 'pass-admin-role', 'liked-event'];



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
		// if (item.itemType==='relation') {
		// 	this.RelationService.update(item._id, {status: 'completed'}).then(() => {
		// 		let index = _.findIndex(this.dashboardItems.items, (data) => {
		// 			return item._id===data._id;
		// 		});
		// 		if (index !== -1) {
		// 			this.dashboardItems.items.splice(index, 1);
		// 			this.dashboardItems.totalItem -= 1;
		// 		}
		// 	}).catch(() => {
		// 		this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		// 	});
		// } else {
		// 	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		// }

		this.RelationService.update(item._id, {status: 'completed'}).then(() => {
			let index = _.findIndex(this.dashboardItems.items, (data) => {
				return item._id===data.element._id;
			});
			if (index !== -1) {
				this.dashboardItems.items.splice(index, 1);
			}
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	friendReject(item) {
		// if (item.itemType==='relation') {
		// 	this.RelationService.delete(item._id).then(() => {
		// 		let index = _.findIndex(this.dashboardItems.items, (data) => {
		// 			return item._id===data._id;
		// 		});
		// 		if (index !== -1) {
		// 			this.dashboardItems.items.splice(index, 1);
		// 			this.dashboardItems.totalItem -= 1;
		// 		}
		// 	}).catch(() => {
		// 		this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		// 	});
		// } else {
		// 	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		// }

		this.RelationService.delete(item._id).then(() => {
				let index = _.findIndex(this.dashboardItems.items, (data) => {
					return item._id===data.element._id;
				});
				if (index !== -1) {
					this.dashboardItems.items.splice(index, 1);
					this.dashboardItems.totalItem -= 1;
				}
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
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
			if (item.element.createdFromRepeatEvent) {
				// when event is created from repeating event we should ask user to cancel this instance or whole repeating event
				this.$uibModal.open({
					animation: true,
					templateUrl: 'app/profile/modal/decline-whole-repeating-event/view.html',
					controller: 'DeclineWholeRepeatingEventCtrl',
					controllerAs: 'DeclineWRE',
					resolve: {
						eventId: () => {
							return item._id;
						}
					}
				}).result.then(() => {
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
				});
			} else {
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
			}
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
						let friends = [];
						_.each(resp.items, (item) => {
							if (item.objectType==='person') {
								window.gapi.client.plus.people.get({userId: item.id}).execute(profile => {
									friends.push(profile);
								});
							}
						});
						this.showSocialFriends(friends, 'google');
					}
				});
			});
		} else if (type==='outlook') {
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
		            	this.showSocialFriends(response.data, 'outlook');
		            }, () => {
		            	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		            }
		        );
			}, () => {
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

	showSocialFriends(friends, type) {
		this.$uibModal.open({
			animation: true,
			controller: 'ShowSocialFriendsCtrl',
			controllerAs: 'ShowSocialFriends',
			templateUrl: 'app/profile/modal/show-social-friends/view.html',
			resolve: {
				friends: () => {
					return friends;
				},
				type: () => {
					return type;
				}
			}
		}).result.then(data => {
			console.log(data);
		});
	}

	loadMore() {
		this.dashboardItems.limitTo+=10;
	}
}

angular.module('healthStarsApp').controller('MyHomeCtrl', MyHomeCtrl);