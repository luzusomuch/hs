'use strict';

class TermsCtrlCtrl {

  constructor($scope, $uibModalInstance) {
  	$scope.apply = () => {
  		$uibModalInstance.close();
  	};

  	$scope.reject = () => {
  		$uibModalInstance.dismiss();
  	};
  }
}

angular.module('healthStarsApp').controller('TermsCtrlCtrl', TermsCtrlCtrl);