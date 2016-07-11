'use strict';

class EventDetailCtrl {
	constructor($scope, event, $localStorage, liked, LikeService, Upload, $cookies, $stateParams, FeedService, PhotoViewer) {
		this.event = event;
		this.viewer = PhotoViewer;
		this.submitted = false;
		this.feed = {};
		this.files = [];
		this.errors = {};
		this.liked = liked;
		this.feeds = [];
		this.authUser = $localStorage.authUser;

		this.LikeService = LikeService;
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.$stateParams = $stateParams;
		this.FeedService = FeedService;

		this.pageSize = 3;
		this.getFeeds({pageSize: this.pageSize});
	}

	getFeeds(params) {
		this.FeedService.getAllByEventId(this.$stateParams.id, params).then(resp => {
			this.feeds = resp.data.items;
			this.pageSize = resp.data.totalItem;
		});
	}

	viewPhoto(photo, fid) {
		if (!photo.blocked) {
			this.viewer.setPhoto(photo, {
				type: 'feed',
				tid: fid
			});
			this.viewer.toggle(true);
		}
	}

	isNotParticipant() {
		if(!this.event.participantsId) {
			return true;
		}
		return this.event.participantsId.indexOf(this.authUser._id) === -1;
	}

	like() {
		this.LikeService.likeOrDislike(this.event._id, 'Event').then(resp => {
			this.liked = resp.data.liked;
			if (this.liked) {
				this.event.totalLike = (this.event.totalLike) ? this.event.totalLike + 1 : 1;
			} else {
				this.event.totalLike = this.event.totalLike -1;
			}
		}).catch(err => {
			console.log(err);
		});
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
			feed.eventId = this.$stateParams.id;
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
	    }, (err) => {
	    	console.log(err);
	    });
		} else {
			this.errors.content = true;
		}
	}

	blockPhoto(photo) {
		this.viewer.blockPhoto(photo._id, this.$stateParams.id).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);