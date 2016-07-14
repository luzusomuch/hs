'use strict';

class HomeCtrl {
	constructor(EventService, LikeService, $localStorage, socket) {
   this.events = {
   	items: [],
   	totalItem: 0
   };
   this.EventService = EventService;
   this.LikeService = LikeService;
   this.search();
   this.authUser = $localStorage.authUser;
   if (this.authUser._id) {
    socket.socket.emit('join', this.authUser._id);
   }
   this.locations = [];
  }

  search() {
  	this.loading = true;
  	this.EventService.search().then(res => {
  		this.events = res.data;
      this.locations = _.map(res.data.items, (item) => {
        return _.assign({title: item.name}, item.location || {});
      });
  		this.loading = false;
  	}, () => this.loading = false);
  }

  pageChange() {
  	this.loading = true;
  	this.EventService.search().then(res => {
  		this.events.items = this.events.items.concat(res.data);
  		this.events.totalItem = res.data.totalItem;
      var locations = _.map(res.data.items, (item) => {
        return _.assign({title: item.name}, item.location || {});
      });
      this.location = this.locations.concat(locations);
  		this.loading = false;
  	}, () => this.loading = false);
  }

  like(event) {
    this.LikeService.likeOrDislike(event._id, 'Event').then(resp => {
      event.liked = resp.data.liked;
      if (event.liked) {
        event.totalLike = (event.totalLike) ? event.totalLike + 1 : 1;
      } else {
        event.totalLike = event.totalLike -1;
      }
    }).catch(err => {
      // TODO - show error message
      console.log(err);
    });
  }
}

angular.module('healthStarsApp').controller('HomeCtrl', HomeCtrl);