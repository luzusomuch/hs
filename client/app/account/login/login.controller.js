'use strict';

class LoginCtrl {
  constructor(Auth, $state, $localStorage, $scope) {
    this.user = {};
    this.errors = {};
    this.submitted = false;

    this.Auth = Auth;
    this.$state = $state;
    this.language = $localStorage.language;

    $scope.$watch('vm.language', (nv) => {
      if (nv && nv!==$localStorage.language) {
        $localStorage.language = nv;
        $localStorage.manualSelectedLanguage = true;
        window.location.reload();
      }
    });
  }

  login(form) {
    this.submitted = true;

    if (form.$valid) {
      this.Auth.login({
          email: this.user.email,
          password: this.user.password
        })
        .then(() => {
          // Logged in, redirect to home
          this.$state.go('home');
        })
        .catch((err) => {
          this.errors.error = err.error;
        });
    }
  }
}

angular.module('healthStarsApp').controller('LoginCtrl', LoginCtrl);
