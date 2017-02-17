'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage, socket, $state, $rootScope, NotificationService) {
		this.user = {};
		this.$localStorage = $localStorage;
		this.$state = $state;
		this.totalNotifications = 0;
		$scope.$watch(() => {
			return $localStorage.authUser;
		}, nv => {
			if(nv) {
				this.user = nv;
				socket.socket.emit('join', nv._id);

				NotificationService.getTotalNotifications().then(resp => {
					this.totalNotifications = resp.data.items.length;
				});
			}
		});

		$rootScope.$on('mark-all-notification-as-read', () => {
			this.totalNotifications = 0;
		});

		socket.socket.on('tracking:user', (data) => {
			$rootScope.onlineUsers = _.uniq(data);
		});

		socket.socket.on('notification:new', () => {
			this.totalNotifications ++;
		});
	}

	changeLanguage(value) {
		this.$localStorage.language = value;
		window.location.reload();
	}
}

angular.module('healthStarsApp').controller('HsHeaderCtrl', HsHeaderCtrl);