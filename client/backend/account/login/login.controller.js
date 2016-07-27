'use strict';

class LoginCtrl {
  constructor(Auth, $state) {
    this.user = {};
    this.errors = {};
    this.submitted = false;

    this.Auth = Auth;
    this.$state = $state;
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
        this.$state.go('backend.dashboard');
      })
      .catch((err) => {
        this.errors.error = err.error;
      });
    }
  }
}

angular.module('healthStarsApp').controller('LoginCtrl', LoginCtrl);
