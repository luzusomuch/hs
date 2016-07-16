'use strict';

class EventMapCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsEventMap', ($interval) => {
	return {
		restrict: 'E',
		scope: {
			locations : '=',
			title: '@',
			center: '=',
			place: '@'
		},
		templateUrl: 'app/event/map/map.html',
		controller: 'EventMapCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function(scope, elm) {
			scope.address = '';
			var map, google;
	    var mapElm = angular.element(elm).find('.event-map');
	    var markers = [];
	    var initMap = function(locations, center) {
	    	center = center || {lat: 52.511, lng: 13.447};
	      map = new google.maps.Map(mapElm[0], {
	        center: center,
	        zoom: 5
	      });
	      var resize = false;
	      if(typeof locations === 'object' && locations.length) {
	      	if(locations.length === 1 && locations[0].fullAddress) {
	      		scope.address = locations[0].fullAddress;
	      	}
	      	var bounds = new google.maps.LatLngBounds();
	      	_.each(locations, function(location) {
	      		let pos = (typeof location === 'object' &&  location.coordinates)? location.coordinates : null;
	      		if(pos) {
	      			var latLng = new google.maps.LatLng(pos[1], pos[0]);
			        var marker = new google.maps.Marker({
			            map: map,
			            position: latLng
			        });
			        markers.push(marker);
			        bounds.extend(latLng);
			        resize = true;
		        }
	        });
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
    		while(markers.length){
            markers.pop().setMap(null);
        }
        
	    	if (nv && nv[0]) {
		    	var $ttl = $interval(() => {
		    		if(window.google && window.google.maps) {
		    			$interval.cancel($ttl);
		    			google = window.google;
		    			if (scope.place==='create-event') {
		    				let data = [{
		    					coordinates: [nv[0].geometry.location.lng, nv[0].geometry.location.lat],
		    					fullAddress: nv[0].formatted_address
		    				}];
		    				initMap(data, scope.center);
		    			} else {
		    				initMap(nv, scope.center);
		    			}
		    		}
		    	}, 250);
	    	}
	    });
		}
	};
}).controller('EventMapCtrl', EventMapCtrl);