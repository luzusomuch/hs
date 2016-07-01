'use strict';

class EventMapCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsEventMap', ($interval) => {
	return {
		restrict: 'E',
		scope: {
			locations : '=',
			center: '='
		},
		templateUrl: 'app/event/map/map.html',
		controller: 'EventMapCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function(scope, elm) {
			var map, google;
	    var mapElm = angular.element(elm).find('.event-map');
	    var initMap = function(locations, center) {
	    	center = center || {lat: 52.511, lng: 13.447};
	      map = new google.maps.Map(mapElm[0], {
	        center: center,
	        zoom: 5
	      });
	      var resize = false;
	      if(typeof locations === 'object' && locations.length) {
	      	 var bounds = new google.maps.LatLngBounds();
	      	for(var i=0; i < locations.length; i++) {
	      		let pos = (typeof locations[i] === 'object' &&  locations[i].coordinates)? locations[i].coordinates : null;
	      		if(pos) {
	      			var latLng = new google.maps.LatLng(pos[1], pos[0]);
			        new google.maps.Marker({
			            map: map,
			            position: latLng
			        });
			        bounds.extend(latLng);
			        resize = true;
		        }
	        }
	        if(resize) {
		        map.setCenter(bounds.getCenter());
						map.fitBounds(bounds);
						var listener = google.maps.event.addListener(map, 'idle', function() { 
						  if (map.getZoom() > 15) { 
						  	map.setZoom(15); 
						  } 
						  google.maps.event.removeListener(listener); 
						});
					}
	      }
	    };
	    scope.$watch('locations', (nv) => {
	    	var $ttl = $interval(() => {
	    		if(window.google && window.google.maps) {
	    			$interval.cancel($ttl);
	    			google = window.google;
	    			initMap(nv, scope.center);
	    		}
	    	}, 250);
	    });
		}
	};
}).controller('EventMapCtrl', EventMapCtrl);