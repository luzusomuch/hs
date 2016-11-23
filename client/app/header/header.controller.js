'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage, socket, $state, $rootScope) {
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

		socket.socket.on('tracking:user', (data) => {
			$rootScope.onlineUsers = _.uniq(data);
		});
	}

	changeLanguage(value) {
		this.$localStorage.language = value;
		window.location.reload();
	}
}

angular.module('healthStarsApp').controller('HsHeaderCtrl', HsHeaderCtrl);