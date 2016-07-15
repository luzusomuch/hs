'use strict';

class HomeCtrl {
<<<<<<< HEAD
	constructor($scope, EventService, LikeService, $localStorage, SearchParams, $state) {
    this.searchParams = SearchParams;
    this.events = {
     	items: [],
     	totalItem: 0
    };
    this.EventService = EventService;
    this.LikeService = LikeService;
    this.search();
    this.authUser = $localStorage.authUser;
    this.locations = [];
    this.$state = $state;
    if (this.authUser._id) {
      socket.socket.emit('join', this.authUser._id);
    }
    // Tracking online/offline user
    socket.socket.on('tracking:user', (data) => {
      console.log(data);
    });

    this.locations = [];

    this.countNewEvent = 0;
     // tracking count new event in realtime
    socket.socket.on('tracking:count-new-event', (data) => {
      this.countNewEvent +=1;
    });

    $scope.$watch(() => {
      return SearchParams;
    }, (nv) => {
      console.log(nv);
    }, true);
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