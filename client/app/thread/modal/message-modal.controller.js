class MessageModalCtrl {
	constructor($scope, $uibModalInstance, EventService, user, $localStorage, ThreadService, growl) {
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
				}).catch(() => {
					growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
				});
			} else {
				growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
			}
		};

		$scope.close = () => {
			$uibModalInstance.dismiss();
		};
	}
}

angular.module('healthStarsApp').controller('MessageModalCtrl', MessageModalCtrl);