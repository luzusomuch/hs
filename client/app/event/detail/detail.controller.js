'use strict';

class EventDetailCtrl {
	constructor($scope, event, $localStorage, liked, LikeService, Upload, $cookies, $stateParams, FeedService) {
		this.event = event;
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
      }
    });
  }

	createNewFeed(feed) {
		this.submitted = true;
		if (feed.content && feed.content.trim().length > 0) {
			feed.eventId = this.$stateParams.id;
			this.errors = {};
			this.Upload.upload({
	      url: '/api/v1/feeds',
	      arrayKey: '',
	      data: {file: this.files, feed: feed},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
        this.submitted = false;
        this.feed = {};
        this.feeds.push(resp.data);
	    }, (err) => {
	    	console.log(err);
	    });
		} else {
			this.errors.content = true;
		}
	}

}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);