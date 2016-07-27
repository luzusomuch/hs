'use strict';

angular.module('healthStarsApp').directive('backendHeader', () => {
	return {
		restrict: 'E',
		controller: 'BackendHeaderCtrl',
		controllerAs: 'vm',
		replace: true,
		templateUrl: 'backend/header/header.html'
	};
});
