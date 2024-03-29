'use strict';

class EventMapCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsEventMap', ($interval, $uibModal) => {
	return {
		restrict: 'E',
		scope: {
			locations : '=',
			title: '@',
			center: '=',
			place: '@',
			radius: '='
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
	    	var circle;

	    	var openBiggerMap = function(map) {
	    		$uibModal.open({
			    	animation: true,
			    	templateUrl: 'app/event/map/bigger-map.html',
			    });
	    	};
	    	
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
			      		var markerColor = 'red';
			      		// apply color for marker
			      		if (location.category) {
				      		switch (location.category.type) {
								case 'action':
									markerColor = 'purple';
									break;
								case 'food':
									markerColor = 'red';
									break;
								case 'eco':
									markerColor = 'green';
									break;
								case 'social':
									markerColor = 'yellow';
									break;
								case 'internation':
									markerColor = 'blue';
									break;
								default:
									break;
							}
			      		}

			      		if(pos) {
			      			var latLng = new google.maps.LatLng(pos[1], pos[0]);
					        var marker = new google.maps.Marker({
					            map: map,
					            position: latLng,
					            _id: location._id,
					            icon: {
							        path: google.maps.SymbolPath.CIRCLE,
							        strokeColor: markerColor,
							        scale: 3
							    },
					        });
					        markers.push(marker);
					        bounds.extend(latLng);
					        resize = true;

					        google.maps.event.addListener(marker, 'click', function() {
							    if (marker._id) {
							    	window.location.href = '/event/detail/'+marker._id;
							    }
							});
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
					// write circle
					if (scope.radius) {
						var circle = new google.maps.Circle({
				            strokeColor: '#FF0000',
				            strokeOpacity: 0.8,
				            strokeWeight: 2,
				            fillColor: '#FF0000',
				            fillOpacity: 0.35,
				            map: map,
				            center: bounds.getCenter(),
				            radius: Number(scope.radius)*1000
			          	});
			          	// open modal with bigger google map when clicked on circle
					  	google.maps.event.addListener(circle, 'click', function() {
					  		console.log('circle clicked');
				        });
					}
	      		}

	      		// open modal with bigger google map when clicked on map
	      		map.addListener('click', function() {
				    console.log('map clicked');
			  	});
	   		};

		    scope.$watch('locations', (nv) => {
	    		for(var i=0; i< markers.length; i++) {
	    			markers[i].setMap(null);
	    		}
	    		markers = [];
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