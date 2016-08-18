class MessageModalCtrl {
	constructor($scope, $uibModalInstance, EventService, user, $localStorage, ThreadService) {
		$scope.submitted = false;
		$scope.authUser = $localStorage.authUser;
		$scope.user = user;
		$scope.message = {};

		$scope.sendMessage = (form) => {
			$scope.submitted = true;
			if (form.$valid) {
				$scope.message.fromUserId = $scope.authUser._id;
				$scope.message.toUserId = $scope.user._id;
				ThreadService.create($scope.message).then(() => {
					$uibModalInstance.close();
				}).catch(err => {
					// TODO show error
				});
			} else {
				// TODO show error
			}
		};

		$scope.close = () => {
			$uibModalInstance.dismiss();
		};
	}
}

angular.module('healthStarsApp').controller('MessageModalCtrl', MessageModalCtrl);