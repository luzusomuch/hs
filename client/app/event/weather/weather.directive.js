'use strict';

class EventWeatherCtrl {
	constructor() {}
}

angular.module('healthStarsApp').directive('hsWeather', (AppSettings, WeatherAPI, Util, $rootScope, SearchParams) => {
	return {
		restrict: 'E',
		scope: {
			location : '=',
		},
		templateUrl: 'app/event/weather/weather.html',
		controller: 'EventWeatherCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function(scope) {
			var settings = AppSettings.getDefaultSettings();
			var params = {
				appid: settings.apiKey.weather,
				cnt: 7,
				units: 'metric'
			};
			scope.data = [];
			scope.moment = moment;
			scope.$index = -1;
			scope.previous = function() {
				if(scope.$index <=0) {
					return false;
				}
				scope.$index--;
			};
			scope.next = function() {
				if(scope.$index >= 6) {
					return false;
				}
				scope.$index++;
			};
			scope.$watch('location', function(nv) {
				scope.valid = false;
				if(nv) {
					// Update weather location when change search place
					params.lon = nv.lng;
					params.lat = nv.lat;
				} else if ($rootScope.location) {
					// When user clear search location, then we use the current location of user to get weather
					params.lon = $rootScope.location.lng;
					params.lat = $rootScope.location.lat;
				}

				if (params.lon && params.lat) {
					var query = Util.obToquery(params);
					WeatherAPI.get(query).then(function(res) {
						if(res.data.cod === '200') {
							scope.data = res.data;
							$rootScope.$index = scope.$index = _.findIndex(scope.data.list, function(item) {
								return moment(item.dt * 1000).days() === moment().days();
							});
							scope.valid = true;
						}
					});
				}
			});

			scope.searchParams = SearchParams.params;
			scope.$watch('searchParams.dates', (nv) => {
				if (nv && nv.length > 0) {
					let date = nv[nv.length-1];
					if (scope.data) {
						scope.$index = _.findIndex(scope.data.list, (item) => {
							return moment(date).days()===moment(item.dt*1000).days();
						});
					}
				} else {
					scope.$index = $rootScope.$index;
				}
			});
		}
	};
})
.factory('WeatherAPI', function($http) {
	return {
		get: (query) => {
			return $http.get(`http://api.openweathermap.org/data/2.5/forecast/daily?${query}`);
		}
	};
})
.factory('weatherIcons', function(){
	return {
	  '200': {
	    'label': 'thunderstorm with light rain',
	    'icon': 'storm-showers'
	  },

	  '201': {
	    'label': 'thunderstorm with rain',
	    'icon': 'storm-showers'
	  },

	  '202': {
	    'label': 'thunderstorm with heavy rain',
	    'icon': 'storm-showers'
	  },

	  '210': {
	    'label': 'light thunderstorm',
	    'icon': 'storm-showers'
	  },

	  '211': {
	    'label': 'thunderstorm',
	    'icon': 'thunderstorm'
	  },

	  '212': {
	    'label': 'heavy thunderstorm',
	    'icon': 'thunderstorm'
	  },

	  '221': {
	    'label': 'ragged thunderstorm',
	    'icon': 'thunderstorm'
	  },

	  '230': {
	    'label': 'thunderstorm with light drizzle',
	    'icon': 'storm-showers'
	  },

	  '231': {
	    'label': 'thunderstorm with drizzle',
	    'icon': 'storm-showers'
	  },

	  '232': {
	    'label': 'thunderstorm with heavy drizzle',
	    'icon': 'storm-showers'
	  },

	  '300': {
	    'label': 'light intensity drizzle',
	    'icon': 'sprinkle'
	  },

	  '301': {
	    'label': 'drizzle',
	    'icon': 'sprinkle'
	  },

	  '302': {
	    'label': 'heavy intensity drizzle',
	    'icon': 'sprinkle'
	  },

	  '310': {
	    'label': 'light intensity drizzle rain',
	    'icon': 'sprinkle'
	  },

	  '311': {
	    'label': 'drizzle rain',
	    'icon': 'sprinkle'
	  },

	  '312': {
	    'label': 'heavy intensity drizzle rain',
	    'icon': 'sprinkle'
	  },

	  '313': {
	    'label': 'shower rain and drizzle',
	    'icon': 'sprinkle'
	  },

	  '314': {
	    'label': 'heavy shower rain and drizzle',
	    'icon': 'sprinkle'
	  },

	  '321': {
	    'label': 'shower drizzle',
	    'icon': 'sprinkle'
	  },

	  '500': {
	    'label': 'light rain',
	    'icon': 'rain'
	  },

	  '501': {
	    'label': 'moderate rain',
	    'icon': 'rain'
	  },

	  '502': {
	    'label': 'heavy intensity rain',
	    'icon': 'rain'
	  },

	  '503': {
	    'label': 'very heavy rain',
	    'icon': 'rain'
	  },

	  '504': {
	    'label': 'extreme rain',
	    'icon': 'rain'
	  },

	  '511': {
	    'label': 'freezing rain',
	    'icon': 'rain-mix'
	  },

	  '520': {
	    'label': 'light intensity shower rain',
	    'icon': 'showers'
	  },

	  '521': {
	    'label': 'shower rain',
	    'icon': 'showers'
	  },

	  '522': {
	    'label': 'heavy intensity shower rain',
	    'icon': 'showers'
	  },

	  '531': {
	    'label': 'ragged shower rain',
	    'icon': 'showers'
	  },

	  '600': {
	    'label': 'light snow',
	    'icon': 'snow'
	  },

	  '601': {
	    'label': 'snow',
	    'icon': 'snow'
	  },

	  '602': {
	    'label': 'heavy snow',
	    'icon': 'snow'
	  },

	  '611': {
	    'label': 'sleet',
	    'icon': 'sleet'
	  },

	  '612': {
	    'label': 'shower sleet',
	    'icon': 'sleet'
	  },

	  '615': {
	    'label': 'light rain and snow',
	    'icon': 'rain-mix'
	  },

	  '616': {
	    'label': 'rain and snow',
	    'icon': 'rain-mix'
	  },

	  '620': {
	    'label': 'light shower snow',
	    'icon': 'rain-mix'
	  },

	  '621': {
	    'label': 'shower snow',
	    'icon': 'rain-mix'
	  },

	  '622': {
	    'label': 'heavy shower snow',
	    'icon': 'rain-mix'
	  },

	  '701': {
	    'label': 'mist',
	    'icon': 'sprinkle'
	  },

	  '711': {
	    'label': 'smoke',
	    'icon': 'smoke'
	  },

	  '721': {
	    'label': 'haze',
	    'icon': 'day-haze'
	  },

	  '731': {
	    'label': 'sand, dust whirls',
	    'icon': 'cloudy-gusts'
	  },

	  '741': {
	    'label': 'fog',
	    'icon': 'fog'
	  },

	  '751': {
	    'label': 'sand',
	    'icon': 'cloudy-gusts'
	  },

	  '761': {
	    'label': 'dust',
	    'icon': 'dust'
	  },

	  '762': {
	    'label': 'volcanic ash',
	    'icon': 'smog'
	  },

	  '771': {
	    'label': 'squalls',
	    'icon': 'day-windy'
	  },

	  '781': {
	    'label': 'tornado',
	    'icon': 'tornado'
	  },

	  '800': {
	    'label': 'clear sky',
	    'icon': 'sunny'
	  },

	  '801': {
	    'label': 'few clouds',
	    'icon': 'cloudy'
	  },

	  '802': {
	    'label': 'scattered clouds',
	    'icon': 'cloudy'
	  },

	  '803': {
	    'label': 'broken clouds',
	    'icon': 'cloudy'
	  },

	  '804': {
	    'label': 'overcast clouds',
	    'icon': 'cloudy'
	  },


	  '900': {
	    'label': 'tornado',
	    'icon': 'tornado'
	  },

	  '901': {
	    'label': 'tropical storm',
	    'icon': 'hurricane'
	  },

	  '902': {
	    'label': 'hurricane',
	    'icon': 'hurricane'
	  },

	  '903': {
	    'label': 'cold',
	    'icon': 'snowflake-cold'
	  },

	  '904': {
	    'label': 'hot',
	    'icon': 'hot'
	  },

	  '905': {
	    'label': 'windy',
	    'icon': 'windy'
	  },

	  '906': {
	    'label': 'hail',
	    'icon': 'hail'
	  },

	  '951': {
	    'label': 'calm',
	    'icon': 'sunny'
	  },

	  '952': {
	    'label': 'light breeze',
	    'icon': 'cloudy-gusts'
	  },

	  '953': {
	    'label': 'gentle breeze',
	    'icon': 'cloudy-gusts'
	  },

	  '954': {
	    'label': 'moderate breeze',
	    'icon': 'cloudy-gusts'
	  },

	  '955': {
	    'label': 'fresh breeze',
	    'icon': 'cloudy-gusts'
	  },

	  '956': {
	    'label': 'strong breeze',
	    'icon': 'cloudy-gusts'
	  },

	  '957': {
	    'label': 'high wind, near gale',
	    'icon': 'cloudy-gusts'
	  },

	  '958': {
	    'label': 'gale',
	    'icon': 'cloudy-gusts'
	  },

	  '959': {
	    'label': 'severe gale',
	    'icon': 'cloudy-gusts'
	  },

	  '960': {
	    'label': 'storm',
	    'icon': 'thunderstorm'
	  },

	  '961': {
	    'label': 'violent storm',
	    'icon': 'thunderstorm'
	  },

	  '962': {
	    'label': 'hurricane',
	    'icon': 'cloudy-gusts'
	  }
	};
})
.filter('weatherIcon', function(weatherIcons){
	return function(weather) {
		if(!weather) {
			return '';
		}
		var prefix = 'wi wi-';
	  var code = weather[0].id;
	  var icon = weatherIcons[code].icon;

	  // If we are not in the ranges mentioned above, add a day/night prefix.
	  if (!(code > 699 && code < 800) && !(code > 899 && code < 1000)) {
	    icon = 'day-' + icon;
	  }

	  // Finally tack on the prefix.
	  icon = prefix + icon;
	  return icon;
	};
})
.filter('weatherIconWithPng', () => {
	return (weather) => {
		if (!weather) {
			return '';
		}
		let icon = weather[0].icon;
		let link;
		switch (icon) {
			case '02d':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-clouds-icon.png';
				break;
			case '01d':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-clear-icon.png';
				break;
			case '03d':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-many-clouds-icon.png';
				break;
			case '04d':
				link = 'http://icons.iconarchive.com/icons/icons-land/weather/128/Overcast-icon.png';
				break;
			case '09d':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-showers-scattered-icon.png';
				break;
			case '10d':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-showers-scattered-day-icon.png';
				break;
			case '11d':
				link = 'assets/images/day-thunderstorm.png';
				break;
			case '13d':
				link = 'assets/images/snow.png';
				break;
			case '50d':
				link = 'https://cdn.iconscout.com/public/images/icon/free/png-512/haze-air-mist-weather-wind-372afcd950ff168e-512x512.png';
				break;
			case '01n':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/256/Status-weather-clear-night-icon.png';
				break;
			case '02n':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-clouds-night-icon.png';
				break;
			case '03n':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-many-clouds-icon.png';
				break;
			case '04n':
				link = 'http://icons.iconarchive.com/icons/icons-land/weather/128/Overcast-icon.png';
				break;
			case '09n':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-showers-scattered-icon.png';
				break;
			case '10n':
				link = 'http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Status-weather-storm-night-icon.png';
				break;
			case '11n':
				link = 'assets/images/day-thunderstorm.png';
				break;
			case '13n':
				link = 'assets/images/snow.png';
				break;
			case '13n':
				link = 'https://cdn.iconscout.com/public/images/icon/free/png-512/haze-air-mist-weather-wind-372afcd950ff168e-512x512.png';
				break;
			default:
				break;
		}
		return link;
	};
})
.controller('EventWeatherCtrl', EventWeatherCtrl);