'use strict';

angular.module('healthStarsApp')
.directive('searchInput', (SearchParams, $timeout, EventService) => {
	return {
		restrict: 'E',
		templateUrl: 'app/search/templates/text.html',
		replace: true,
		link: (scope, element) => {
			let elm = angular.element(element).find('input');
			let suggest = '';
			scope.items = [];
			scope.suggests = [];
			var updateItem = (e) => {
				scope.items.push(e.item);
				//scope.$apply();
			};

			var removeItem = (e) => {
				_.remove(scope.items, item => item === e.item);
				//scope.$apply();
			};

			var autocomplete = (value) => {
				suggest = value;
				EventService.suggest(value).then(
					res => {
						scope.suggests = res.data;
					}
				);
			}

			elm.tagsinput();
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
			};

			scope.select = (value) => {
				scope.suggests = [];
				elm.tagsinput('remove', suggest);
				elm.tagsinput('add', value);
			};

			scope.$watch('items', (nv) => {
				SearchParams.keywords = nv.join(',');
			}, true);
		}
	}	
})
.directive('searchLocation', (SearchParams, $timeout, $http) => {
	return {
		restrict: 'E',
		templateUrl: 'app/search/templates/location.html',
		replace: true,
		link: (scope, element) => {
			scope.addresses = [];
			scope.params = {
				address: '',
				postCode: '',
				radius: '',
				radius: ''
			};

			scope.select = function(address) {
				scope.address = angular.copy(address);
				scope.addresses = [];
			};

			scope.search = () => {
				SearchParams = _.merge(SearchParams, {address: scope.address, radius: scope.radius});
				angular.element('body').trigger('click');
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
});