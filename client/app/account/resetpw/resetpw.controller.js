'use strict';

class ResetPwCtrl {
  constructor($scope, Auth, $state, $uibModal, resetData) {
    this.user = {
      token: resetData.token
    };
    this.Auth = Auth;
    this.loading = false;
    this.data = resetData;

    $scope.$watch('vm.user', () => {
      this.error = '';
    }, true);

  }

  resetPass(form) {
    this.submitted = true;
    if(this.loading) {
      return false;
    }

    if (form.$valid) {
      this.loading = true;
      this.Auth.resetPassword(this.user)
      .then(() => {
        this.success = true;
        this.loading = false;
        this.submitted = false;
      })
      .catch(err => {
        this.error = err.data.type;
        this.loading = false;
        this.submitted = false;
      });
    }
  }
}

angular.module('healthStarsApp').controller('ResetPwCtrl', ResetPwCtrl);