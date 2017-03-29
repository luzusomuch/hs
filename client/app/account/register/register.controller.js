'use strict';

class RegisterCtrl {
  //end-non-standard

  constructor(Auth, $state, $http, $scope, $uibModal, growl, User) {
    this.growl = growl;
    this.Auth = Auth;
    this.User = User;
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
    this.validEmail = false;
  }
  //start-non-standard

  checkInUseEmail(form, email) {
    if (email) {
      this.User.checkEmailInUse(email).then(resp => {
        if (!resp.data.valid) {
          form['email'].$setValidity('mongoose', false);
          this.validEmail = false;
        } else {
          form['email'].$setValidity('mongoose', true);
          this.validEmail = true;
        }
      });
    }
  }

  refreshAddresses(address) {
    if (address.trim().length > 0) {
      var params = {address: address, sensor: false};
      return this.$http.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
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
    if (this.validEmail) {
      form['email'].$setValidity('mongoose', true);
    }
    this.submitted = true;
    if (!this.user.term) {
      this.growl.error(`<p>{{'PLEASE_ACCEPT_OUR_TERMS_AND_CONDITIONS' | translate}}</p>`);
      return;
    }
    if (form.$valid && this.address.selected) {
      if (this.user.phoneNumber) {
        this.user.phoneNumber = $('#phone').intlTelInput('getNumber');
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
        controllerAs: 'TCtrl'
      });
      modalInstance.result.then(() => {
        this.Auth.createUser({
          name: this.user.name,
          email: this.user.email,
          password: this.user.password,
          phoneNumber: this.user.phoneNumber,
          location: this.user.location,
          isCompanyAccount: this.user.isCompanyAccount
        }, (err) => {
          if (err) {
            this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
              if (error.message==='The specified email address is already in use.') {
                this.errors.emailUsed = true;
              }
              this.errors[field] = error.message;
            });
          } else {
            // this.$state.go('home');
            this.growl.success(`<p>{{'SIGN_UP_SUCCESSFULLY_PLEASE_CONFIRM_YOUR_EMAIL_TO_CONTINUE' | translate}}</p>`)
          }
//         }).then((err, resp) => {
//           console.log(err);
//           console.log(resp);
//           // Account created, redirect to home
//           this.$state.go('home');
//         }, err => {
//           console.log(err);
//         }).catch(err => {
//           this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
          
//           this.errors = {};
// console.log(err.data);
//           angular.forEach(err.data, (err) => {
//             if (err && err.path) {
//               form[err.path].$setValidity(err.path, false);
//               this.errors[err.path] = err.type;
//             }
//           });

//           // Update validity of form fields that match the mongoose errors
//           err = err.data;
//           angular.forEach(err.errors, (error, field) => {
//             form[field].$setValidity('mongoose', false);
//             this.errors[field] = error.message;
//           });
        });
      });
    } else {
      this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
    }
  }
}

angular.module('healthStarsApp').controller('RegisterCtrl', RegisterCtrl);