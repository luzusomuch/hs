'use strict';

class HomeCtrl {
	constructor($scope, EventService, LikeService, $localStorage, CategoryService, SearchParams, socket, $state, $timeout, categories) {
    this.$scope = $scope;
    this.categories = categories;
    this.searchParams = SearchParams.params;
    this.searchParams.categories = _.map(categories, '_id');
    this.page = 1;
    this.loaded = false;
    this.events = {
     	items: [],
     	totalItem: 0
    };
    this.EventService = EventService;
    this.LikeService = LikeService;
    this.authUser = $localStorage.authUser;
    this.locations = [];
    this.$state = $state;
    if (this.authUser && this.authUser._id) {
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

    let ttl;
    $scope.geoLocation = false;
    $scope.timeout = false;
    $timeout(() => {
      $scope.timeout = true
    }, 3000);

    $scope.$watch('[vm.searchParams, geoLocation, timeout]', (nv) => {
      if(nv[1]) {
        $scope.timeout = true;
      }
      if(nv && ( nv[1] || nv[2])) {
        if(ttl) {
          $timeout.cancel(ttl);
        }
        ttl = $timeout(this.search.bind(this), 250);
      }
    }, true);

    let prevOffset = 0;

    let ttl2;
    let loadMore = (event) => {
      let content = angular.element('section[masonry]');
      let windowHeight = angular.element(window).height();
      let bottom = content.closest('.container')[0].offsetTop + content.height();
      let offset = windowHeight + angular.element(document).scrollTop();
      let documenHeight = angular.element(document).height();
      let dir = offset > prevOffset ? 'down' : 'up';
      prevOffset = offset;
      if(dir === 'down' && ((offset + windowHeight ) >= (documenHeight - 50))) {
        if(ttl2) {
          $timeout.cancel(ttl2);
        }
        ttl2 = $timeout(this.pageChange.bind(this), 500);
      }
    }

    angular.element(document).bind('scroll', loadMore.bind(this));
    $scope.$on('$destroy', () => {
       angular.element(document).unbind('scroll');
    });
    // geo location
    if (navigator.geolocation && (!this.searchParams.address || !this.searchParams.address.geometry || !this.searchParams.address.geometry.location)) {
      navigator.geolocation.getCurrentPosition( position => {
        this.searchParams.address.geometry = {
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        };
        this.searchParams.radius = 1000;
        $scope.geoLocation = true;
        $scope.$$phase || $scope.$apply();
      }, () => {
        $scope.geoLocation = true;
        $scope.$$phase || $scope.$apply();
      });
    } else {
      $scope.geoLocation = true;
    }
  }

  search() {
    if(this.loading) {
      return false;
    }
  	this.loading = true;
    this.events =  {
      items: [],
      totalItem: 0
    };
    this.page = 1;
    let params = angular.copy(this.searchParams);
    params.page = this.page;
    if(params.address && params.address.geometry && params.address.geometry.location) {
      params.location = angular.copy(params.address.geometry.location);
    }
    delete params.address;
  	this.EventService.search(params).then(res => {
  		this.events = res.data;
      this.locations = _.map(res.data.items, (item) => {
        return _.assign({title: item.name}, item.location || {});
      });
  		this.loading = false;
      this.loaded = true;
  	}, () => this.loading = false);
  }

  pageChange() {
    if(this.loading || !this.loaded) {
      return false;
    }
  	this.loading = true;
    this.page++;
    let params = angular.copy(this.searchParams);
    params.page = this.page;
    if(params.address && params.address.geometry && params.address.geometry.location) {
      params.location = angular.copy(params.address.geometry.location);
    }
    delete params.address;
  	this.EventService.search(params).then(res => {
  		this.events.items = this.events.items.concat(res.data.items);
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
    let index = this.searchParams.categories.indexOf(category._id);
    if( index === -1) {
      this.searchParams.categories.push(category._id);
    } else {
      this.searchParams.categories.splice(index, 1);
    } 
    return true;
  }

  isActive(category) {
    return this.searchParams.categories.indexOf(category._id) !== -1;
  }
}

angular.module('healthStarsApp').controller('HomeCtrl', HomeCtrl);