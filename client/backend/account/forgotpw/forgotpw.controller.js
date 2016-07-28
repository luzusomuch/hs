'use strict';

class ForgotPwCtrl {
  constructor($scope, Auth, Util) {
    this.user = {};
    this.errors = {};
    this.submitted = false;
    this.Auth = Auth;
    this.emailPattern = Util.emailPattern();

    this.loading = false;
    $scope.$watch('vm.user', () => {
      this.error = '';
    }, true);
  }

  forgotPass(form) {
    if(this.loading) {
      return false;
    }
    this.submitted = true;

    if (form.$valid) {
      this.loading = true;
      this.Auth.forgotPassword(this.user.email)
      .then(() => {
        // alert to user to know/check mail
        this.success = true;
        this.loading = false;
      })
      .catch(err => {
        this.error = err.data.type;
        this.loading = false;
      });
    }
  }
}

angular.module('healthStarsApp').controller('ForgotPwCtrl', ForgotPwCtrl);