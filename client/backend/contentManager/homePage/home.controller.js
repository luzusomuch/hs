'use strict';

class BackendContentManagerHomePageCtrl {
	constructor(Upload, $cookies, $state) {
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
    }, (err) => {
    	console.log(err);
    	// TODO show error
    });
	}
}

angular.module('healthStarsApp').controller('BackendContentManagerHomePageCtrl', BackendContentManagerHomePageCtrl);