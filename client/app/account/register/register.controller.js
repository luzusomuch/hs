'use strict';

class RegisterCtrl {
  //end-non-standard

  constructor(Auth, $state, $http) {
    this.Auth = Auth;
    this.$state = $state;
    this.$http = $http;
    this.user = {
      isCompanyAccount: false,
      location: {}
    };
    
    this.address = {};
    this.addresses = [];
  }
  //start-non-standard

  refreshAddresses(address) {
    if (address.trim().length > 0) {
      var params = {address: address, sensor: false};
      return this.$http.get(
        'http://maps.googleapis.com/maps/api/geocode/json',
        {params: params}
      ).then( (response) => {
        this.addresses = response.data.results;
      });
    }
  }

  register(form) {
    this.submitted = true;
    if (form.$valid && this.address.selected) {
      var selectedAddress = this.address.selected;
      this.user.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
      this.user.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
      this.user.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
      this.user.location.fullAddress = selectedAddress.formatted_address;
      this.user.name = this.user.firstName +' '+ this.user.lastName;

      this.Auth.createUser({
        name: this.user.name,
        email: this.user.email,
        password: this.user.password,
        phoneNumber: this.user.phoneNumber,
        location: this.user.location
      })
      .then(() => {
        // Account created, redirect to home
        this.$state.go('home');
      })
      .catch(err => {
        this.errors = {};

        angular.forEach(err.data, (err) => {
          form[err.path].$setValidity(err.path, false);
          this.errors[err.path] = err.type;
        });

        // Update validity of form fields that match the mongoose errors
        err = err.data;
        angular.forEach(err.errors, (error, field) => {
          form[field].$setValidity('mongoose', false);
          this.errors[field] = error.message;
        });
      });
    }
  }
}

angular.module('healthStarsApp').controller('RegisterCtrl', RegisterCtrl);