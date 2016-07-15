'use strict';

angular.module('healthStarsApp')
.directive('searchInput', (SearchParams, $timeout, EventService) => {
	return {
		restrict: 'E',
		templateUrl: 'app/search/templates/text.html',
		replace: true,
		link: (scope, element) => {
			let elm = angular.element(element).find('input');
			scope.items = [];
			var updateItem = (e) => {
				scope.items.push(e.item);
				scope.$apply();
			};

			var removeItem = (e) => {
				_.remove(scope.items, item => item === e.item);
				scope.$apply();
			};

			var autocomplete = (value) => {
				EventService.suggest(value).then(
					res => {
						console.log(res);
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
				scope.address = angular.copy(address.formatted_address);
				scope.addresses = [];
			};

			var autocomplete  = (value) => {
				var params = {address: value, sensor: false};
				console.log(params);
				$http.get('http://maps.googleapis.com/maps/api/geocode/json', { params: params })
				.then( res => {
					console.log(res);
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