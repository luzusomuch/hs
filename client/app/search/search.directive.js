'use strict';

angular.module('healthStarsApp')
.directive('searchInput', (SearchParams, $timeout, EventService, $state) => {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/search/templates/text.html',
		replace: true,
		link: function(scope, element) {
			let elm = angular.element(element).find('input');
			let suggest = '';
			scope.items = [];
			scope.suggests = [];
			var updateItem = (e) => {
				scope.items.push(e.item);
				scope.suggests = [];
				scope.$$phase || scope.$apply();
			};

			var removeItem = (e) => {
				_.remove(scope.items, item => item === e.item);
				scope.suggests = [];
				scope.$$phase || scope.$apply();
			};

			var autocomplete = (value) => {
				EventService.suggest(value).then(
					res => {
						scope.suggests = res.data;
					}
				);
			}

			elm.tagsinput({addOnBlur: false});

			elm.on('itemAdded', updateItem).on('itemRemoved', removeItem);
			var ttl;
			$timeout(() => {
				var input = angular.element(element).find('.bootstrap-tagsinput > input')
				input.keyup((e) => {
					if(ttl) {
						$timeout.cancel(ttl);		
					}
					ttl = $timeout(() => {
						autocomplete(e.target.value);
					}, 1000);
				});
			}, 500);

			scope.removeAll = () => {
				elm.tagsinput('removeAll');
				scope.items = [];
				$timeout(function(){
					angular.element(document.getElementById('btn-clear-location-search')).trigger('click');
					angular.element('.calendar-home > div').datepicker('clearDates');
					SearchParams.params.category = '';
					SearchParams.params.categories = [];
					SearchParams.params.friendActivities = false;
					angular.element(element).find('button').trigger('click');
        });
			};

			angular.element(element).on('click', 'ul.dropdown-menu > li > a', function(e) {
				e.preventDefault();
				var index = angular.element(this).parent().index();
				var value = scope.suggests[index]; 
				scope.suggests = [];
				elm.tagsinput('add', value);
				elm.tagsinput('input').val('');
			});

			angular.element('body').on('click', function(e) {
				var target = angular.element(e.target);
				let tagsinput = angular.element(element).find('.bootstrap-tagsinput');
				if(angular.element(element).find(target).length === 0 && target !== tagsinput) {
					var value = elm.tagsinput('input').val();
					elm.tagsinput('add', value);
					elm.tagsinput('input').val('');
				}
			});

			let first = true;

			// scope.$watch('items', (nv) => {
			// 	console.log(nv);
			// 	console.log(first);
			// 	if(!first) {
			// 		SearchParams.params.keywords = nv.join(',');
			// 		$state.go('home');
			// 	}
			// 	first = false;
			// }, true);

			scope.search = () => {
				SearchParams.params.keywords = scope.items.join(',');
				$state.go('home');
			};
		}
	}	
})
.directive('searchLocation', (SearchParams, $timeout, $http) => {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/search/templates/location.html',
		replace: true,
		link: function(scope, element) {
			scope.addresses = [];
			scope.radius = SearchParams.params.radius = 100;
			scope.params = {
				address: SearchParams.params.address,
				postCode: '',
				radius: angular.copy(SearchParams.params.radius)
			};

			scope.$watch('params.address.geometry', (nv) => {
				if (nv && nv.location) {
					$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+nv.location.lat+','+nv.location.lng)
					.then( res => {
						scope.address = res.data.results[0];
						if (scope.address.formatted_address && scope.address.formatted_address.length > 20) {
							scope.address.shorted_address = scope.address.formatted_address.substr(0, 20) + ' ...';
						} else {
							scope.address.shorted_address = scope.address.formatted_address;
						}
		      		});
				}
			});

			scope.select = function(address) {
				scope.address = angular.copy(address);
				if (scope.address.formatted_address && scope.address.formatted_address.length > 20) {
					scope.address.shorted_address = scope.address.formatted_address.substr(0, 20) + ' ...';
				} else {
					scope.address.shorted_address = scope.address.formatted_address;
				}
				scope.addresses = [];
			};

			scope.search = () => {
				var address = angular.copy(scope.address);
				var radius = angular.copy(scope.radius);
				SearchParams.params = _.assign(SearchParams.params, {address: address, radius: radius});
				angular.element('body').trigger('click');
				scope.style={'background-color': '#3598dc', color: '#fff'};
			}

			scope.clear = () => {
				scope.address = {};
				scope.radius = '';
				SearchParams.params = _.assign(SearchParams.params, {address: {}, radius: ''});
				angular.element('body').trigger('click');
				scope.style = {};
			}

			var autocomplete  = (value) => {
				var params = {address: value, sensor: false};
				$http.get('http://maps.googleapis.com/maps/api/geocode/json', { params: params })
				.then( res => {
					scope.addresses = res.data.results;
	      		});
			};

			var ttl;

			element.find('.location').keyup((e) => {
				if(ttl) {
					$timeout.cancel(ttl);		
				}
				ttl = $timeout(() => {
					autocomplete(e.target.value);
				}, 1000);
			});
		}
	}	
})
.directive('searchDate', (SearchParams) => {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/search/templates/datepicker.html',
		replace: true,
		link: function(scope, element) {
			angular.element(element).find('.calendar-home > div').datepicker({
				multidate: true,
				maxViewMode: 0,
				todayHighlight: true,
			}).on('changeDate', function(e) {
				var dates = angular.element(element).find('.calendar-home > div').datepicker('getDates');
				scope.dt = dates.map(function(date) { return moment(date).format('DD.MM.YYYY'); });
				scope.$$phase || scope.$apply();
    	});
			scope.style = {};
			scope.dt = [];
			scope.$watch('dt', function(nv) {
				var dates = angular.element(element).find('.calendar-home > div').datepicker('getDates');
				SearchParams.params.dates = dates.map(function(date) { return new Date(date).getTime(); });
			}, true);
			
			scope.filter = function() {
				var dates = angular.element(element).find('.calendar-home > div').datepicker('getDates');
				SearchParams.params.dates = dates.map(function(date) { return new Date(date).getTime(); });
				scope.style = {'background-color': '#3071a9', border: '#3071a9'};
			}

			scope.clear = function() {
				SearchParams.params.dates = [];
				angular.element(element).find('.calendar-home > div').datepicker('clearDates');
				scope.style =  {};
			}
		}
	}
});