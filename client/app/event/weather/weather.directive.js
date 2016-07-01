'use strict';

class EventWeatherCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsEventWeather', () => {
	return {
		restrict: 'E',
		scope: {
			location : '=',
		},
		templateUrl: 'app/event/weather/weather.html',
		controller: 'EventWeatherCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function(scope, elm) {
			console.log('weather directive');
		}
	};
}).controller('EventWeatherCtrl', EventWeatherCtrl);