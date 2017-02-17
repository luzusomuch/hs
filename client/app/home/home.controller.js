'use strict';

class HomeCtrl {
	constructor($rootScope, $localStorage, $scope, EventService, LikeService, authUser, CategoryService, SearchParams, socket, $state, $timeout, categories, growl, User, Auth) {
    this.growl = growl;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$localStorage = $localStorage;
    this.Auth = Auth;
    this.User = User;
    this.categories = [];
    // re-order category
    _.each(categories, (cat) => {
      switch (cat.type) {
        case 'food': 
          cat.menuName = 'foodstar';
          cat.order = 2;
          break;
        case 'action':
          cat.menuName = 'actionstar';
          cat.order = 5;
          break;
        case 'eco':
          cat.menuName = 'ecostar';
          cat.order = 4;
          break;
        case 'social': 
          cat.menuName = 'socialstar';
          cat.order = 3; 
          break;
        case 'internation':
          cat.menuName = 'sportstar';
          cat.order = 1;
          break;
        default:
          cat.menuName = cat.type;
          cat.order = categories.length;
          break;
      }
    });
    this.categories = categories;
    this.searchParams = SearchParams.params;
    //this.searchParams.categories = _.map(categories, '_id');
    this.page = 1;
    this.loaded = false;
    this.events = {
     	items: [],
     	totalItem: 0
    };
    this.EventService = EventService;
    this.LikeService = LikeService;
    this.authUser = authUser;
    this.locations = [];
    this.$state = $state;

    this.locations = [];

    this.countNewEvent = 0;
     // tracking count new event in realtime
    socket.socket.on('tracking:count-new-event', () => {
      this.countNewEvent +=1;
    });

    let ttl;
    $scope.geoLocation = false;
    $scope.timeout = false;
    $timeout(() => {
      $scope.timeout = true;
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
    let loadMore = () => {
      // let content = angular.element('section[masonry]');
      let windowHeight = angular.element(window).height();
      // let bottom = content.closest('.container')[0].offsetTop + content.height();
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
    };

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
        $rootScope.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.searchParams.radius = 100;
        $scope.geoLocation = true;
        $scope.$$phase || $scope.$apply();
      }, () => {
        $scope.geoLocation = true;
        this.growl.error(`<p>{{'CANNOT_TRACKING_YOUR_LOCATION' | translate}}</p>`);
        $scope.$$phase || $scope.$apply();
      });
    } else {
      $scope.geoLocation = true;
    }

    // show popup when hover category star
    this.showPopup = false;
    this.currentPopupContent = {};
  }

  dontShowAgain() {
    this.User.updateUserPopupStarInfoStatus(this.authUser._id, {status: true}).then(resp => {
      this.Auth.setAuthUser(resp.data.hidePopupStarInfo, 'hidePopupStarInfo');
      this.showPopup = false;
    }).catch(() => {
      this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
    });
  }

  showPopover(category) {
    this.showPopup = true;
    switch (category.type) {
      case 'food': 
        this.currentPopupContent = {
          name: category.menuName,
          content: 'FOODSTAR_CONTENT',
        };
        break;
      case 'action':
        this.currentPopupContent = {
          name: category.menuName,
          content: 'ACTIONSTAR_CONTENT',
        };
        break;
      case 'eco':
        this.currentPopupContent = {
          name: category.menuName,
          content: 'ECOSTAR_CONTENT',
        };
        break;
      case 'social': 
        this.currentPopupContent = {
          name: category.menuName,
          content: 'SOCIALSTAR_CONTENT',
        };
        break;
      case 'internation':
        this.currentPopupContent = {
          name: category.menuName,
          content: 'SPORTSTAR_CONTENT',
        };
        break;
      default:
        this.currentPopupContent = {};
        break;
    }
    if (this.authUser.hidePopupStarInfo) {
      this.currentPopupContent = {};
      this.showPopup = false;
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
      this.$scope.$emit('refreshMyUpcomingEvents');
    }).catch(() => {
      this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
    });
  }

  selectCategory(category) {
    // let index = this.searchParams.categories.indexOf(category._id);
    // if( index === -1) {
    //   this.searchParams.categories.push(category._id);
    // } else {
    //   this.searchParams.categories.splice(index, 1);
    // } 
    // return true;
    this.searchParams.category = category._id === this.searchParams.category ? '' : category._id;
  }

  isActive(category) {
    return this.searchParams.category === category._id;
    //return this.searchParams.categories.indexOf(category._id) !== -1;
  }

  checkParticipants(participantsId, waitingParticipantIds, ownerId) {
    let data = (participantsId && participantsId.length > 0) ? angular.copy(participantsId) : [];
    data.push(ownerId._id);
    data = _.union(data, waitingParticipantIds);

    let index = _.findIndex(data, (id) => {
      return id.toString()===this.authUser._id.toString();
    });
    return index !== -1;
  }

  participate(event) {
    // check user joined or not
    if (this.checkParticipants(event.participantsId, event.waitingParticipantIds, event.ownerId)) {
      return this.growl.error(`<p>{{'YOU_HAVE_JOINED_THIS_EVENT' | translate}}</p>`);
    }
    this.EventService.attendEvent(event._id).then(resp => {
      if (resp.data.isParticipant) {
        event.participantsId.push(this.authUser._id);
        event.stats.totalParticipants++;
        this.growl.success(`<p>{{'JOINED_EVENT_SUCCESSFULLY' | translate}}</p>`);
      } else {
        this.growl.success(`<p>{{'EVENT_REACHED_LIMIT_NUMBER' | translate}}</p>`);
        if (event.waitingParticipantIds && event.waitingParticipantIds.length > 0) {
          event.waitingParticipantIds.push(this.authUser._id);
        } else {
          event.waitingParticipantIds = [this.authUser._id];
        }
      }
      this.$scope.$emit('refreshMyUpcomingEvents');
    }).catch(() => {
      this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
    });
  }

  // check if you interested in an event
  isInterested(event) {
    let index = _.findIndex(this.events.items, item => {
      return item._id===event._id && event.liked;
    });
    return index !== -1;
  }
}

angular.module('healthStarsApp').controller('HomeCtrl', HomeCtrl);