'use strict';

class EventMapCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsEventMap', () => {
	return {
		restrict: 'E',
		scope: {
			location : '=',
		},
		templateUrl: 'app/event/map/map.html',
		controller: 'EventMapCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function(scope, elm) {
			var map;
	    var google = window.google;
	    var mapElm = angular.element(elm).find('.event-map');
	    var initMap = function(pos) {
	      map = new google.maps.Map(mapElm[0], {
	        center: {lat: pos[1], lng: pos[0]},
	        zoom: 16
	      });

        new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(pos[1], pos[0])
        });
	    };
	    scope.$watch('location', (nv) => {
	    	if(nv && nv.coordinates) {
	    		initMap(nv.coordinates);
	    	}
	    });
		}
	};
}).controller('EventMapCtrl', EventMapCtrl);