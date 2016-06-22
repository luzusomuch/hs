'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage) {
		this.user = {};
		$scope.$watch(() => {
			return $localStorage.authUser;
		}, nv => {
			if(nv) {
				this.user = nv;
			}
		});
	}
}

angular.module('healthStarsApp').controller('HsHeaderCtrl', HsHeaderCtrl);