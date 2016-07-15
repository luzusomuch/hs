'use strict';

class HomeCtrl {
	constructor($scope, EventService, LikeService, $localStorage, CategoryService, SearchParams, socket, $state, $timeout) {
    this.searchParams = SearchParams;
    this.page = 1;
    this.events = {
     	items: [],
     	totalItem: 0
    };
    this.categories = [];
    this.categoryId = '';
    CategoryService.getAll().then(resp => {
      this.categories = resp.data.items;
    });
    this.EventService = EventService;
    this.LikeService = LikeService;
    this.authUser = $localStorage.authUser;
    this.locations = [];
    this.$state = $state;
    if (this.authUser._id) {
      socket.socket.emit('join', this.authUser._id);
    }
    // Tracking online/offline user
    socket.socket.on('tracking:user', (data) => {
      //console.log(data);
    });

    this.locations = [];

    this.countNewEvent = 0;
     // tracking count new event in realtime
    socket.socket.on('tracking:count-new-event', (data) => {
      this.countNewEvent +=1;
    });

    $scope.$watch('vm.categoryId', (nv) => {
      SearchParams.category = nv;
    });

    var ttl;
    $scope.$watch(() => {
      return SearchParams;
    }, (nv) => {
      if(ttl) {
        $timeout.cancel(ttl);
      }
      ttl = $timeout(this.search.bind(this), 500);
    }, true);
  }

  search() {
    console.log('search');
  	this.loading = true;
    this.events =  {
      items: [],
      totalItem: 0
    };
    this.page = 1;
    let params = angular.copy(this.searchParams);
    params.page = this.page;
  	this.EventService.search(this.searchParams).then(res => {
  		this.events = res.data;
      this.locations = _.map(res.data.items, (item) => {
        return _.assign({title: item.name}, item.location || {});
      });
  		this.loading = false;
  	}, () => this.loading = false);
  }

  pageChange() {
  	this.loading = true;
    this.page++;
    let params = angular.copy(this.searchParams);
    params.page = this.page;
  	this.EventService.search(this.searchParams).then(res => {
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

  selectCategory(category) {
    this.categoryId = this.categoryId === category._id ? '' : category._id;
  }
}

angular.module('healthStarsApp').controller('HomeCtrl', HomeCtrl);