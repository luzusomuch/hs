'use strict';

class ProfileDetailCtrl {
	constructor(Auth, growl, $scope, $rootScope, $state, $uibModal, $localStorage, APP_CONFIG, PhotoViewer, user, $cookies, Upload, FeedService, EventService, RelationService) {
		this.Auth = Auth;
		this.growl = growl;
		if ((user.deleted && user.deleted.status) || (user.blocked && user.blocked.status)) {
			this.growl.error(`<p>{{'EMAIL_DELETED' | translate}}</p>`);
			$state.go('home');
		}
		this.errors = {};
		this.page = 1;
		this.$uibModal = $uibModal;
		this.Upload = Upload;
		this.FeedService = FeedService;
		this.EventService = EventService;
		this.RelationService = RelationService;
		this.$cookies = $cookies;
		this.authUser = $localStorage.authUser;
		this.$localStorage = $localStorage;
		this.user = user;
		this.user.link = APP_CONFIG.baseUrl + 'profile/' + this.user._id;
		this.PhotoViewer = PhotoViewer;
		this.$rootScope = $rootScope;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4, userId: user._id}).then(resp => {
			this.photos = resp.data;
		});

		this.feed = {};
		this.feeds = {};
		this.files = [];

		this.events = {
			page: 1
		};

		this.friends = {
			page: 1
		};

		this.getFeeds({page: this.page});
		this.getUserEvent();
		this.getUserFriend();
	}

	getFeeds(params) {
		this.FeedService.getAll(this.user._id, 'user', params).then(resp => {
			this.feeds.items = (this.feeds.items) ? this.feeds.items.concat(resp.data.items) : resp.data.items;
			this.feeds.totalItem = resp.data.totalItem;
			this.page += 1;
		});
	}

	loadMoreFeeds() {
		this.getFeeds({page: this.page});
	}

	viewPhoto(photo) {
		this.PhotoViewer.setPhoto(photo, {});
		this.PhotoViewer.toggle(true);
	}

	select($files) {
  	$files.forEach(file => {
      	//check file
    	let index = _.findIndex(this.files, (f) => {
      	return f.name === file.name && f.size === file.size;
    	});

    	if (index === -1) {
      	this.files.push(file);
      	this.checkNude(file, (result) => {
      		file.nude = result;
      	});
  		}
  	});
	}

	checkNude(file, cb) {
  	setTimeout(function() {
  		window.nude.load(file.name);
	  	window.nude.scan(result => {
	  		cb(result);
	  	});
  	}, 500);
	}

	removeImage(index) {
		this.files.splice(index, 1);
	}

	upload(file, type) {
		if (this.user._id.toString()===this.authUser._id.toString()) {
	  		if (file && file.length > 0) {
	  			this.$uibModal.open({
					animation: true,
					templateUrl: 'app/profile/modal/crop-image/view.html',
					controller: 'CropImageCtrl',
					controllerAs: 'CropImage',
					resolve: {
						file: () => {
							return file;
						},
						cropType: () => {
							return 'rectangle';
						},
						imageSize: () => {
							let height = (file[0].$ngfHeight > 300) ? file[0].$ngfHeight : 300; 
				            let width = height * 3;
				            return {width: width, height: height};
						},
          				isBanner: () => {
	            			return true;
	          			}
					}
				}).result.then(data => {
					this.Upload.upload({
				      	url: '/api/v1/users/change-picture',
				      	arrayKey: '',
				      	data: {file: data, type: type},
				      	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
			    	}).then(resp =>{
			    		this.user[resp.data.type] = resp.data.photo;
			    		this.Auth.setAuthUser(this.user);
		    			this.$rootScope.$emit('update-user-profile');
			    	}, () => {
			    		this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    	});
				});

		  		// this.Upload.upload({
		    //   	url: '/api/v1/users/change-picture',
		    //   	arrayKey: '',
		    //   	data: {file: file, type: type},
		    //   	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
			   //  }).then(resp =>{
			   //  	this.user[resp.data.type] = resp.data.photo;
			   //  	this.Auth.setAuthUser(this.user);
			   //  }, () => {
			   //  	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			   //  });
	  		}
		} else {
			this.growl.error(`<p>{{'NOT_ALLOW' | translate}}</p>`);
		}
	}

	createNewFeed(feed) {
		this.submitted = true;
		this.errors = {};
		if (_.filter(this.files, {nude: true}).length > 0) {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
			this.errors.file = true;
			return false;
		}
		if (feed.content && feed.content.trim().length > 0) {
			feed.userId = this.user._id;
			feed.userFeed = true;
			this.Upload.upload({
	      		url: '/api/v1/feeds',
	      		arrayKey: '',
	      		data: {file: this.files, feed: feed},
	      		headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    	}).then(resp =>{
		        this.submitted = false;
		        this.feed = {};
		        this.files = [];
		        this.feeds.items.push(resp.data);
		    }, () => {
		    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		    });
		} else {
			this.errors.content = true;
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	blockPhoto(photo) {
		this.PhotoViewer.blockPhoto(photo._id, {type: 'user-profile', userId: this.user._id}).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	getUserEvent() {
		this.EventService.getUserEvent({userId: this.user._id, pageSize: 2, page: this.events.page}).then(resp => {
			this.events.items = (this.events.items) ? this.events.items.concat(resp.data.items) : resp.data.items;
			this.events.totalItem = resp.data.totalItem;
			this.events.page +=1;
		});
	}

	getUserFriend() {
		this.RelationService.getAll({id: this.user._id, type: 'friend'}).then(resp => {
			this.friends.items = (this.friends.items) ? this.friends.items.concat(resp.data.items) : resp.data.items;
			this.friends.totalItem = resp.data.totalItem;
			this.friends.page +=1;
		});
	}

	addFriend() {
		this.RelationService.create({userId: this.user._id, type: 'friend'}).then(resp => {
			this.user.isFriend = resp.data.type;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	follow() {
		this.RelationService.create({userId: this.user._id, type: 'follow'}).then(resp => {
			this.user.isFollow = resp.data.type;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	showAllEvents() {
		this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/profile/user-events/view.html',
    	controller: 'UserEventsCtrl',
    	resolve: {
    		user: () => {
    			return this.user;
    		}
    	}
    });
	}

	sendMessage() {
		this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/thread/modal/message.html',
    	controller: 'MessageModalCtrl',
    	resolve: {
    		user: () => {
    			return this.user;
    		}
    	}
    });
	}

	blockFeed(feed) {
		this.FeedService.block(feed._id).then(resp => {
			feed.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	editSetting() {
		this.$uibModal.open({
			animation: true,
			templateUrl: 'app/profile/modal/edit-user-location/view.html',
			controller: 'EditUserLocationCtrl',
			controllerAs: 'EditUL',
			resolve: {
				user: () => {
					return this.user;
				}
			}
		}).result.then(resp => {
			this.user.location = resp.location;
			this.user.pointClub = resp.pointClub;
			this.user.job = resp.job;
			this.Auth.setAuthUser(this.user);
		});
	}
}

angular.module('healthStarsApp').controller('ProfileDetailCtrl', ProfileDetailCtrl);