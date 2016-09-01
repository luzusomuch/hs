class AwardDetailCtrl {
	constructor($scope, award, $uibModalInstance) {
		$scope.award = award;

		$scope.closeModal = () => {
			$uibModalInstance.close();
		};
	}

	
}

angular.module('healthStarsApp').controller('AwardDetailCtrl', AwardDetailCtrl);