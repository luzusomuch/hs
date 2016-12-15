'use strict';

class EditUserLocationCtrl {
	constructor($uibModalInstance, User, user, growl, $http) {
		this.$http = $http;
		this.$uibModalInstance = $uibModalInstance;
		this.User = User;
		this.user = angular.copy(user);
		this.growl = growl;
		this.address = {};
		if (this.user.location) {
			let params =  {
				latlng: this.user.location.coordinates[1]+','+this.user.location.coordinates[0],
				sensor: false
			};
			$http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
			.then( res => {
				this.address.selected = res.data.results[0];
  		});
		}
		this.user.location = (this.user.location) ? this.user.location : {};
		this.addresses = [];
		this.submitted = false;
	}

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

	submit(form) {
		this.submitted = true;
		if (form.$valid) {
			var selectedAddress = this.address.selected;
			if (selectedAddress) {
				this.user.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
      	this.user.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
      	this.user.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
      	this.user.location.fullAddress = selectedAddress.formatted_address;

				this.User.updateUserLocation(this.user._id, {
					location: this.user.location,
					pointClub: this.user.pointClub,
					job: this.user.job
				}).then(resp => {
					this.$uibModalInstance.close(resp.data);
					this.growl.success(`<p>{{'UPDATE_ACCOUNT_SUCCESSFULLY' | translate}}</p>`);
				}).catch(() => {
					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
				});
			} else {
				this.growl.error(`<p>{{'PLEASE_SELECT_YOUR_LOCATON' | translate}}</p>`);
			}
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('EditUserLocationCtrl', EditUserLocationCtrl);