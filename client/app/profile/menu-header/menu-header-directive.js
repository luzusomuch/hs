'use strict';

class MenuHeaderCtrl {
	constructor($scope, $state, $localStorage) {
		$scope.$state = $state;
		this.authUser = $localStorage.authUser;
	}
}

angular.module('healthStarsApp').directive('hsProfileMenuHeader', () => {
	return {
		restrict: 'E',
		controller: 'MenuHeaderCtrl',
		templateUrl: 'app/profile/menu-header/menu-header.html'
	};
}).controller('MenuHeaderCtrl', MenuHeaderCtrl);