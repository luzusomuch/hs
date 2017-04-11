'use strict';

class HsHeaderCtrl {
	constructor($scope, $localStorage, socket, $state, $rootScope, NotificationService, Auth) {
		this.user = {};
		this.$localStorage = $localStorage;
		this.$state = $state;
		this.totalNotifications = 0;

		// $scope.$watch(() => {
		// 	return $localStorage.authUser;
		// }, nv => {
		// 	if(nv) {
		// 		this.user = nv;
		// 		console.log(this.user.avatar);
		// 		if (nv._id) {
		// 			socket.socket.emit('join', nv._id);

		// 			NotificationService.getTotalNotifications().then(resp => {
		// 				this.totalNotifications = resp.data.items.length;
		// 			});
		// 		}
		// 	}
		// });

		Auth.isLoggedIn(resp => {
			if (!resp) {
				return;
			}
			Auth.getCurrentUser().then(resp => {
				if (resp.data && resp.data._id) {
					this.user = resp.data;

					if (resp.data._id) {
						socket.socket.emit('join', resp.data._id);

						NotificationService.getTotalNotifications().then(resp => {
							this.totalNotifications = resp.data.items.length;
						});
					}
				}
			});
		});

		$rootScope.$on('mark-all-notification-as-read', () => {
			this.totalNotifications = 0;
		});

		$rootScope.$on('update-user-profile', () => {
			this.user = $localStorage.authUser;
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