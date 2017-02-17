'use strict';

class BackendPhotosEventUpdateCtrl {
	constructor($scope, growl, Upload, $cookies, photo) {
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
		this.photo = photo.data.detail;
		this.file = {};
	}

	select($file) {
		this.file = $file;
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid && this.photo.type) {
			this.Upload.upload({
    		url: '/api/v1/photos/' + this.photo._id,
    		method: 'PUT',
    		arrayKey: '',
    		data: {file: this.file, type: this.photo.type},
    		headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
    	}).then(() =>{
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
	.controller('BackendPhotosEventUpdateCtrl', BackendPhotosEventUpdateCtrl);