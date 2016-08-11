'use strict';

class MySettingCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, $http, User, Auth, Upload, $cookies, $timeout) {
		this.submitted =false;
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.address = {};
		if (this.authUser) {
			this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id;
			this.authUser.firstName = this.authUser.name.substr(0,this.authUser.name.indexOf(' '));
			this.authUser.lastName = this.authUser.name.substr(this.authUser.name.indexOf(' ')+1);
			if (this.authUser.location) {
				let params =  {
					latlng: this.authUser.location.coordinates[1]+','+this.authUser.location.coordinates[0],
					sensor: false
				};
				$http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
				.then( res => {
					this.address.selected = res.data.results[0];
	      		});
			}
		}
		this.$state = $state;
		this.$http = $http;
		this.addresses = [];
		this.User = User;
		this.Auth = Auth;
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.APP_CONFIG = APP_CONFIG;
		$timeout(() => {
			gapi.load('auth2', () => {
				this.auth2 = gapi.auth2.init({
					client_id: this.APP_CONFIG.apiKey.ggAppId,
					fetch_basic_profile: false,
					scope: 'profile'
				});
			});
		}, 1000);
	}

	updateAccount(form) {
		this.submitted = true;
		if (form.$valid) {
			var selectedAddress = this.address.selected;
	      	this.authUser.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
	      	this.authUser.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
	      	this.authUser.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
	      	this.authUser.location.fullAddress = selectedAddress.formatted_address;
	      	this.authUser.name = this.authUser.firstName +' '+ this.authUser.lastName;

	      	this.User.updateProfile(this.authUser).then(() => {
	      		this.Auth.setAuthUser(this.authUser);
	      		this.submitted = false;
	      	}).catch(err => {
	      		console.log(err);
	      		// TODO show error
	      	});
		} else {
			// TODO show error
		}
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

  	upload(file, type) {
  		this.Upload.upload({
	      	url: '/api/v1/users/change-picture',
	      	arrayKey: '',
	      	data: {file: file, type: type},
	      	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
	    	this.authUser[resp.data.type] = resp.data.photo;
	    	this.Auth.setAuthUser(this.authUser);
	    }, (err) => {
	    	// TODO show error
	    	console.log(err);
	    });
  	}

  	notificationSetting(type) {
  		this.User.changeNotificationsSetting({type: type}).then(resp => {
			this.authUser.notificationSetting = resp.data.notificationSetting;
			this.Auth.setAuthUser(resp.data.notificationSetting, 'notificationSetting');
  		}).catch(err => {
  			// TODO show err
  			console.log(err);
  		});
  	}

  	addAccount(type) {
  		if (type === 'fb') {
  			FB.api('/me', (response) => {
  				if (!response.error) {
	  				let data = {
	  					data: response,
	  					type: 'facebook'
	  				};
	  				this.User.addSocialAccount(data).then(() => {
	  					// TODO show success message
	  				}).catch(err => {
	  					// TODO show error
	  					console.log(err);
	  				});
  				} else {
  					console.log(response.error);
  					// TODO show error
  				}
		    });
  		} else if (type === 'tw') {
  			this.$http.post('https://api.twitter.com/oauth/authenticate').then(resp => {
  				console.log(resp);
  			}).catch(err => {
  				console.log(err);
  			})
  		} else if (type === 'gg') {
  			this.auth2.signIn().then(() => {
  				let data = {
  					data: {id: this.auth2.currentUser.get().getId()},
  					type: 'google'
  				};
				this.User.addSocialAccount(data).then(() => {
					// TODO show success message
  				}).catch(err => {
  					// TODO show error
  					console.log(err);
  				});
			});
  		}
  	}

  	changePassword(form) {
  		this.submitted = true;
  		if (form.$valid) {
  			this.Auth.changePassword(this.oldpassword, this.password).then(() => {
  				// TODO show success
  			}).catch(() => {
  				// TODO show error
  			});
  		} else {
  			// TODO show error
  		}
  	}

  	deleteAccount() {
  		this.User.deleteAccount(this.authUser._id).then(() => {
  			this.Auth.logout();
  			this.$state.go('home');
  		}).catch(err => {
  			console.log(err);
  			// TODO show eror
  		});
  	}
}

angular.module('healthStarsApp').controller('MySettingCtrl', MySettingCtrl);