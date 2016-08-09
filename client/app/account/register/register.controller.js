'use strict';

class RegisterCtrl {
  //end-non-standard

  constructor(Auth, $state, $http, $scope, $uibModal) {
    this.Auth = Auth;
    this.$state = $state;
    this.$http = $http;
    this.$uibModal = $uibModal;
    this.user = {
      isCompanyAccount: false,
      location: {},
      term: true
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
        _.each(response.data.results, (address) => {
          address.formatted_short_address = address.formatted_address.substr(0,30) + ' ...';
        });
        this.addresses = response.data.results;
      });
    }
  }

  register(form) {
    form['email'].$setValidity('mongoose', true);
    this.submitted = true;
    if (!this.user.term) {
      // TODO show error
      console.log('Please accept our terms and conditions');
      return;
    }
    if (form.$valid && this.address.selected) {
      if (this.user.phoneNumber) {
        this.user.phoneNumber = $("#phone").intlTelInput('getNumber');
      }
      var selectedAddress = this.address.selected;
      this.user.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
      this.user.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
      this.user.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
      this.user.location.fullAddress = selectedAddress.formatted_address;
      this.user.name = this.user.firstName +' '+ this.user.lastName;

      let modalInstance = this.$uibModal.open({
        animation: true,
        templateUrl: 'app/account/terms/termModal.html',
        controller: 'TermsCtrlCtrl',
      });
      modalInstance.result.then(() => {
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
            if (err && err.path) {
              form[err.path].$setValidity(err.path, false);
              this.errors[err.path] = err.type;
            }
          });

          // Update validity of form fields that match the mongoose errors
          err = err.data;
          angular.forEach(err.errors, (error, field) => {
            form[field].$setValidity('mongoose', false);
            this.errors[field] = error.message;
          });
        });
      }, err => {
        console.log(err);
        // TODO show error
      });
    }
  }
}

angular.module('healthStarsApp').controller('RegisterCtrl', RegisterCtrl);