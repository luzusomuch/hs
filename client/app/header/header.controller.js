'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage, socket) {
		this.user = {};
		$scope.$watch(() => {
			return $localStorage.authUser;
		}, nv => {
			if(nv) {
				this.user = nv;
				socket.socket.emit('join', nv._id);
			}
		});
	}
}

angular.module('healthStarsApp').controller('HsHeaderCtrl', HsHeaderCtrl);