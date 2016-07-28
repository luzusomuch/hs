'use strict';

class BackendSidebarCtrl {
	constructor($scope, $localStorage, $state) {
		this.user = {};
		$scope.$watch(() => {
			return $localStorage.authUser;
		}, nv => {
			if(nv) {
				this.user = nv;
			}
		});
		this.$state = $state;
	}
}

angular.module('healthStarsApp').controller('BackendSidebarCtrl', BackendSidebarCtrl);