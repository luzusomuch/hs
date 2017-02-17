'use strict';

class BackendPhotosEventCreateCtrl {
	constructor($scope, growl, Upload, $cookies) {
		this.$cookies = $cookies;
		this.Upload = Upload;
		this.growl = growl;
		this.types = [
			'Sport picture', 
			'Sport banner', 
			'Food picture', 
			'Food banner', 
			'Social picture', 
			'Social banner', 
			'Eco picture', 
			'Eco banner',
			'Action picture',
			'Action banner'
		];
		this.submitted = false;
		this.file = {};
	}

	select($file) {
		this.file = $file;
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid && this.file.name && this.selectedType) {
			this.Upload.upload({
    		url: '/api/v1/photos',
    		arrayKey: '',
    		data: {file: this.file, type: this.selectedType},
    		headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
    	}).then(() =>{
				this.file = {};
				this.selectedType = null;
				this.submitted = false;
				this.growl.success(`<p>{{'CREATE_PHOTO_EVENT_SUCCESSFULLY' | translate}}</p>`);
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	    });
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}
}

angular.module('healthStarsApp')
	.controller('BackendPhotosEventCreateCtrl', BackendPhotosEventCreateCtrl);