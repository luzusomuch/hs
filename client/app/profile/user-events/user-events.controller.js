class UserEventsCtrl {
	constructor($scope, $uibModalInstance, EventService, user) {
		$scope.user = user;
		$scope.events = {
			page: 1
		};

		$scope.getUserEvents = () => {
			EventService.getUserEvent({userId: user._id, pageSize: 10, page: $scope.events.page}).then(resp => {
				$scope.events.items = ($scope.events.items) ? $scope.events.items.concat(resp.data.items) : resp.data.items;
				$scope.events.totalItem = resp.data.totalItem;
				$scope.events.page +=1;
			});
		};

		$scope.getUserEvents();

		$scope.close = () => {
			$uibModalInstance.dismiss();
		};
	}
}

angular.module('healthStarsApp').controller('UserEventsCtrl', UserEventsCtrl);