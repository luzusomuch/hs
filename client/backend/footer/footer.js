'use strict';

angular.module('healthStarsApp').directive('backendFooter', () => {
	return {
		restrict: 'E',
		controller: 'BackendFooterCtrl',
		controllerAs: 'vm',
		replace: true,
		templateUrl: 'backend/footer/footer.html'
	};
});
