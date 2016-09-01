'use strict';

class BackendContentManagerHomePageCtrl {
	constructor(Upload, $cookies, $state, growl) {
		this.growl = growl;
		this.file = {};
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.$state = $state;
	}

	select(file) {
		this.file = file;
		this.Upload.upload({
      		url: '/api/v1/abouts/sound',
      		data: {file: this.file},
      		headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(() =>{
			this.$state.reload();
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	    });
	}
}

angular.module('healthStarsApp').controller('BackendContentManagerHomePageCtrl', BackendContentManagerHomePageCtrl);