class CreateAwardCtrl {
	constructor($uibModalInstance, $cookies, Upload, growl, AwardService) {
		this.types = [
			{value: 'accepted', text: 'Award will be granted to every users accepted an event'}, 
			{value: 'gps', text: 'Award will be granted to every users have gps signal send from Healthstars App'}, 
			{value: 'organizer', text: 'Award will be granted by organizer'}, 
			{value: 'offline', text: 'Award will be granted by Healthstars offline (only for company accounts)'}
		];
		this.award = {};
		this.file = {};
		this.$uibModalInstance = $uibModalInstance;
		this.$cookies = $cookies;
		this.Upload = Upload;
		this.growl = growl;
		this.AwardService = AwardService;
	}

	select($file) {
  	this.file = $file;
  }

	submit(form) {
		if (form.$valid && this.file.name && this.award.type) {
			this.Upload.upload({
	      url: '/api/v1/awards',
	      arrayKey: '',
	      data: {file: this.file, award: this.award},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
				this.$uibModalInstance.close(resp.data);
	    }, (err) => {
	    	console.log(err);
	    });
		} else {
			this.growl.error('Check your data');
		}
	}
}

angular.module('healthStarsApp').controller('CreateAwardCtrl', CreateAwardCtrl);