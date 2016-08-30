'use strict';

class HealthBookCtrl {
	constructor($scope, $localStorage, EventService, $timeout, LikeService) {
		this.authUser = $localStorage.authUser;
		this.EventService = EventService;
		this.LikeService = LikeService;
		this.events = {
			page: 1
		};

		this.getEvents();

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
		        ttl2 = $timeout(this.getEvents.bind(this), 500);
	      	}
	    }

		angular.element(document).bind('scroll', loadMore.bind(this));
	    $scope.$on('$destroy', () => {
	       angular.element(document).unbind('scroll');
	    });
	}

	getEvents() {
		if ((!this.events.items && !this.events.totalItem) || (this.events.items && this.events.totalItem && this.events.items.length < this.events.totalItem)) {
			this.EventService.getJoinedEvents({page: this.events.page}).then(resp => {
				this.events.items = (this.events.items) ? this.events.items.concat(resp.data.items) : resp.data.items;
				this.events.totalItem = resp.data.totalItem;
				this.events.page += 1;
			});
		}
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

angular.module('healthStarsApp').controller('HealthBookCtrl', HealthBookCtrl);