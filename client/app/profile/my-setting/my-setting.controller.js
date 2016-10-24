'use strict';

class MySettingCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG, $http, User, Auth, Upload, $cookies, growl, $uibModal) {
		this.$uibModal = $uibModal;
		this.growl = growl;
		this.submitted =false;
		this.errors = {};
		this.$localStorage = $localStorage;
		this.authUser = $localStorage.authUser;
		this.address = {};
		if (this.authUser) {
			this.authUser.link = APP_CONFIG.baseUrl + 'profile/' + this.authUser._id + '/detail';
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
			this.authUser.location = (this.authUser.location) ? this.authUser.location : {};
		}
		this.$state = $state;
		this.$http = $http;
		this.addresses = [];
		this.User = User;
		this.Auth = Auth;
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.APP_CONFIG = APP_CONFIG;
		this.language = $localStorage.language;

		$scope.$watch('vm.language', (nv) => {
			if (nv && nv!==$localStorage.language) {
				this.$localStorage.language = nv;
				window.location.reload();
			}
		});
	}

	updateAccount(form) {
		this.submitted = true;
		if (form.$valid) {
			var selectedAddress = this.address.selected;
			if (selectedAddress) {
		      	this.authUser.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
		      	this.authUser.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
		      	this.authUser.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
		      	this.authUser.location.fullAddress = selectedAddress.formatted_address;
		      	this.authUser.name = this.authUser.firstName +' '+ this.authUser.lastName;

		      	this.User.updateProfile(this.authUser._id, this.authUser).then(resp => {
		      		this.authUser.isCompanyAccount = resp.data.isCompanyAccount;
		      		this.Auth.setAuthUser(this.authUser);
		      		this.submitted = false;
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
  		// If user upload avatar then open a modal to resize(crop image)
  		if (file && file.length > 0) {
	  		if (type==='avatar') {
	  			this.$uibModal.open({
	  				animation: true,
	  				templateUrl: 'app/profile/modal/crop-image/view.html',
	  				controller: 'CropImageCtrl',
	  				controllerAs: 'CropImage',
	  				resolve: {
	  					file: () => {
	  						return file;
	  					},
	  					cropType: () => {
	  						return 'circle';
	  					}
	  				}
	  			}).result.then(data => {
	  				this.Upload.upload({
			      	url: '/api/v1/users/change-picture',
			      	arrayKey: '',
			      	data: {file: data, type: type},
			      	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
				    }).then(resp =>{
				    	this.authUser[resp.data.type] = resp.data.photo;
				    	this.Auth.setAuthUser(this.authUser);
				    }, () => {
				    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
				    });
	  			});
	  		} else {
		  		this.Upload.upload({
			      	url: '/api/v1/users/change-picture',
			      	arrayKey: '',
			      	data: {file: file, type: type},
			      	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
			    }).then(resp =>{
			    	this.authUser[resp.data.type] = resp.data.photo;
			    	this.Auth.setAuthUser(this.authUser);
			    }, () => {
			    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    });
	  		}
  		}
  	}

  	notificationSetting(type) {
  		this.User.changeNotificationsSetting({type: type}).then(resp => {
			this.authUser.notificationSetting = resp.data.notificationSetting;
			this.Auth.setAuthUser(resp.data.notificationSetting, 'notificationSetting');
  		}).catch(() => {
  			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
  		});
  	}

  	addAccount(type) {
  		if (type === 'fb') {
  			FB.login(resp => {
  				if (resp.authResponse) {
		  			FB.api('/me', (response) => {
		  				if (!response.error) {
			  				let data = {
			  					data: response,
			  					type: 'facebook'
			  				};
			  				this.User.addSocialAccount(data).then(() => {
			  					this.growl.success(`<p>{{'ADD_SOCIAL_ACCOUNT_SUCCESSFULLY' | translate}}</p>`);
			  				}).catch(() => {
			  					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			  				});
		  				} else {
		  					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		  				}
				    });
  				}
  			});
  		} else if (type === 'tw') {
  			// TODO create function to get current twitter account
  		} else if (type === 'gg') {
  			window.auth2.signIn().then(() => {
  				let data = {
  					data: {id: window.auth2.currentUser.get().getId()},
  					type: 'google'
  				};
				this.User.addSocialAccount(data).then(() => {
					this.growl.success(`<p>{{'ADD_SOCIAL_ACCOUNT_SUCCESSFULLY' | translate}}</p>`);
  				}).catch(() => {
  					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
  				});
			});
  		}
  	}

  	changePassword(form) {
  		this.submitted = true;
  		if (form.$valid) {
  			this.Auth.changePassword(this.oldpassword, this.password).then(() => {
  				this.growl.success(`<p>{{'CHANGE_PASSWORD_SUCCESSFULLY' | translate}}</p>`);
  			}).catch(err => {
  				if (err.status===403) {
  					this.growl.error(`<p>{{'OLD_PASSWORD_INCORRECT' | translate}}</p>`);
  				} else {
  					this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
  				}
  			});
  		} else {
  			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
  		}
  	}

  	deleteAccount() {
  		let confirmText = (this.$localStorage.language==='en') ? 'Do you want to delete your account?' : 'Wollen Sie Ihr Konto löschen?';
  		let confirm = window.confirm(confirmText);
  		if (confirm) {
	  		this.User.deleteAccount(this.authUser._id).then(() => {
	  			this.Auth.logout();
	  			this.$state.go('home');
	  		}).catch(() => {
	  			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	  		});
  		}
  	}
}

angular.module('healthStarsApp').controller('MySettingCtrl', MySettingCtrl);