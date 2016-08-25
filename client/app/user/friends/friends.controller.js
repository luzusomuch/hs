'use strict';

class UserFriendCtrl {
	constructor($scope, User, APP_CONFIG, socket, $localStorage, RelationService) {
		$scope.friends = {};
		$scope.authUser = $localStorage.authUser;
		$scope.page = 1;

		$scope.getFriends = () => {
			User.getFriends($scope.uId, $scope.page).then(res => {
				$scope.friends.items = ($scope.friends.items) ? $scope.friends.items.concat(res.data.items) : res.data.items;
				$scope.friends.totalItem = res.data.totalItem;
				$scope.page += 1;
			});
		};
			
		$scope.$watch('uId', nv => {
			console.log(nv);
			if(nv) {
				$scope.getFriends();
			}
		});

		// Tracking online/offline user
	    socket.socket.on('tracking:user', (data) => {
	     	if (data && $scope.friends.items) {
	     		_.each($scope.friends.items, (friend) => {
	     			friend.online = false;
	     			let index = _.findIndex(data, (item) => {
	     				return item===friend._id;
	     			});
	     			if (index !== -1) {
	     				friend.online = true;
	     			}
	     		});
	     	}
	    });

	    $scope.addFriend = (friend) => {
	    	RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
	    		friend.currentFriendStatus = resp.data.type;
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
	    };
	}
}

angular.module('healthStarsApp').directive('hsUserFriends', () => {
	return {
		restrict: 'E',
		scope: {
			uId : '=',
			hideDescription: '@'
		},
		templateUrl: 'app/user/friends/friends.html',
		controller: 'UserFriendCtrl'
	};
}).controller('UserFriendCtrl', UserFriendCtrl);