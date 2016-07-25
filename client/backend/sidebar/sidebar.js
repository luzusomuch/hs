'use strict';

angular.module('healthStarsApp').directive('backendSidebar', () => {
	return {
		restrict: 'E',
		controller: 'BackendSidebarCtrl',
		controllerAs: 'vm',
		replace: true,
		templateUrl: 'backend/sidebar/sidebar.html'
	};
});
