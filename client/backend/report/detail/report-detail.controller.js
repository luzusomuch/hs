class BackendReportDetailCtrl {
	constructor($scope, report, $uibModalInstance) {
		$scope.report = report;

		$scope.close = () => {
			$uibModalInstance.dismiss();
		};
	}
}

angular.module('healthStarsApp').controller('BackendReportDetailCtrl', BackendReportDetailCtrl);