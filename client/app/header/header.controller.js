'use strict';

class HsHeaderCtrl {
	constructor() {
		console.log('header');
	}
}

angular.module('healthStarsApp').directive('hsHeader', () => {
	return {
		restrict: 'E',
		controller: HsHeaderCtrl,
		controllerAs: 'vm',
		templateUrl: 'app/header/header.html'
	}
})
