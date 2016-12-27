'use strict';

class UserFriendCtrl {
	constructor($scope, $rootScope, User, APP_CONFIG, $localStorage, RelationService, growl) {
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
			if(nv) {
				$scope.getFriends();
			}
		});

		$rootScope.$watch('onlineUsers', nv => {
			$scope.onlineUsers = nv;
		});

	  $scope.$watchGroup(['onlineUsers', 'friends.items'], (nv) => {
	  	console.log(nv);
	  	if (nv[0] && nv[1]) {
	  		_.each(nv[1], (friend) => {
	  			let index = _.findIndex(nv[0], (onlineId) => {
	  				return onlineId.toString()===friend._id.toString();
	  			});
	  			if (index !== -1) {
	  				friend.online=true;
	  			}
	  		});
	  	}
	  }, true);

    $scope.addFriend = (friend) => {
    	RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
    		friend.currentFriendStatus = resp.data.type;
			}).catch(() => {
				growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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