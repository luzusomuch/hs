'use strict';

class RegisterCtrl {
  //end-non-standard

  constructor(Auth, $state) {
    this.Auth = Auth;
    this.$state = $state;
    this.user = {
      isCompanyAccount: false,
      location: {}
    };
  }
  //start-non-standard


  register(form) {
    this.submitted = true;
    console.log(form);
    if (form.$valid) {
      // TODO - need an API to find out lng, lat and zipcode when user select location
      this.user.name = this.user.firstName +" "+ this.user.lastName;
      this.Auth.createUser({
          name: this.user.name,
          email: this.user.email,
          password: this.user.password,
          phoneNumber: this.user.phoneNumber,
          location: this.user.location
        })
        .then(() => {
          // Account created, redirect to home
          this.$state.go('main');
        })
        .catch(err => {
          err = err.data;
          this.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, (error, field) => {
            form[field].$setValidity('mongoose', false);
            this.errors[field] = error.message;
          });
        });
    }
  }
}

angular.module('healthStarsApp').controller('RegisterCtrl', RegisterCtrl);