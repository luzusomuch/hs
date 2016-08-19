'use strict';

class MyFriendsCtrl {
	constructor($localStorage, APP_CONFIG, PhotoViewer, RelationService, user, User) {
		this.RelationService = RelationService;
		this.User = User;
		this.user = user;
		this.friends = {
			page: 1
		};
		this.authUser = $localStorage.authUser;
		this.user.link = APP_CONFIG.baseUrl + 'profile/' + this.user._id +'/detail';
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4, userId: user._id}).then(resp => {
			this.photos = resp.data;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});

		this.loadFriends();
		this.defaultFriends = {};
	}

	loadFriends() {
		this.User.getFriends(this.user._id, this.friends.page).then(res => {
			this.friends.items = (this.friends.items) ? this.friends.items.concat(res.data.items) : res.data.items;
			this.friends.totalItem = res.data.totalItem;
			this.friends.page += 1;
		});	
	}

	viewPhoto(photo) {
		this.PhotoViewer.setPhoto(photo, {});
		this.PhotoViewer.toggle(true);
	}

	friendAction(friend) {
		if (friend.currentFriendStatus==='completed') {
			// Unfriend
			this.RelationService.deleteByUserId(friend._id, {withUserId: true}).then(() => {
				let index = _.findIndex(this.friends.items, (item) => {
					return item._id.toString()===friend._id.toString();
				});
				if (index !== -1) {
					if (this.authUser._id===this.user._id) {
						// If current user is owner of friends list then remove selected friend from list
						this.friends.items.splice(index, 1);
					} else {
						// If current user isn't owner of friends list just update selected friend status
						this.friends.items[index].currentFriendStatus = 'none';
					}
				}
			}).catch(err => {	
				// TODO show error
				console.log(err);
			});
		} else if (friend.currentFriendStatus==='none') {
			// add friend
			this.RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
				friend.currentFriendStatus = resp.data.type;
			}).catch(err => {
				// TODO show error
				console.log(err);
			})
		} else {
			// TODO show error
		}
	}

	search(text) {
		if (text && text.trim().length > 0) {
			this.defaultFriends = angular.copy(this.friends);
			this.RelationService.searchFriends({query: text, userId: this.user._id}).then(resp => {
				this.friends.items = resp.data.items;
				this.friends.totalItem = resp.data.totalItem;
			}).catch(err => {	
				// TODO show error
				console.log(err);
			})
		} else {
			this.friends = this.defaultFriends;
		}
	}
}

angular.module('healthStarsApp').controller('MyFriendsCtrl', MyFriendsCtrl);