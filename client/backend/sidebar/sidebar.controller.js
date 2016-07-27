'use strict';

class BackendSidebarCtrl {
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

angular.module('healthStarsApp').controller('BackendSidebarCtrl', BackendSidebarCtrl);