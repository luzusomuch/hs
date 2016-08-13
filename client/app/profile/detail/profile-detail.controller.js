'use strict';

class ProfileDetailCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, PhotoViewer, user, $cookies, Upload, FeedService) {
		this.errors = {};
		this.page = 1;
		this.Upload = Upload;
		this.FeedService = FeedService;
		this.$cookies = $cookies;
		this.authUser = $localStorage.authUser;
		this.user = user;
		this.user.link = APP_CONFIG.baseUrl + 'profile/' + this.user._id;
		this.$state = $state;
		this.PhotoViewer = PhotoViewer;

		this.photos = {};
		this.PhotoViewer.myPhotos({pageSize: 4, userId: user._id}).then(resp => {
			this.photos = resp.data;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});

		this.feed = {};
		this.feeds = {};
		this.files = [];

		this.getFeeds({page: this.page});

	}

	getFeeds(params) {
		this.FeedService.getAll(this.user._id, 'user', params).then(resp => {
			this.feeds.items = (this.feeds.items) ? this.feeds.concat(resp.data.items) : resp.data.items;
			this.feeds.totalItem = resp.data.totalItem;
			this.page += 1;
			console.log(this.feeds);
		});
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
	  		nude.load(file.name);
		  	nude.scan(result => {
		  		cb(result);
		  	});
	  	}, 500);
  	}

  	removeImage(index) {
  		this.files.splice(index, 1);
  	}

  	createNewFeed(feed) {
		this.submitted = true;
		this.errors = {};
		if (_.filter(this.files, {nude: true}).length > 0) {
			return this.errors.file = true;
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
		        this.feeds.push(resp.data);
		        this.event.totalComment = (this.event.totalComment) ? this.event.totalComment+1 : 1;
		    }, (err) => {
		    	console.log(err);
		    	// TODO show error
		    });
		} else {
			this.errors.content = true;
		}
	}
}

angular.module('healthStarsApp').controller('ProfileDetailCtrl', ProfileDetailCtrl);