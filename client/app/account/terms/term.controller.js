'use strict';

class TermsCtrlCtrl {

  constructor($uibModalInstance, $localStorage) {
  	this.$uibModalInstance = $uibModalInstance;
  	this.$localStorage = $localStorage;
  }

  apply() {
  	this.$uibModalInstance.close();
  }

  reject() {
  	this.$uibModalInstance.dismiss();
  }
}

angular.module('healthStarsApp').controller('TermsCtrlCtrl', TermsCtrlCtrl);