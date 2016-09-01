'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage, socket, $state) {
		this.user = {};
		this.$localStorage = $localStorage;
		this.$state = $state;
		$scope.$watch(() => {
			return $localStorage.authUser;
		}, nv => {
			if(nv) {
				this.user = nv;
				socket.socket.emit('join', nv._id);
			}
		});
	}

	changeLanguage(value) {
		this.$localStorage.language = value;
		window.location.reload();
	}
}

angular.module('healthStarsApp').controller('HsHeaderCtrl', HsHeaderCtrl);