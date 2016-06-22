'use strict';

angular.module('healthStarsApp').directive('hsFooter', () => {
	return {
		restrict: 'E',
		controller: 'HsFooterCtrl',
		controllerAs: 'vm',
		templateUrl: 'app/footer/footer.html'
	};
});
