class CreateAwardCtrl {
	constructor($uibModalInstance, $cookies, Upload, growl, AwardService, friends) {
		this.friends = friends;
		this.types = [
			{value: 'accepted'}, 
			{value: 'gps'}, 
			{value: 'organizer'}, 
			{value: 'offline'}
		];
		this.award = {};
		this.file = {};
		this.$uibModalInstance = $uibModalInstance;
		this.$cookies = $cookies;
		this.Upload = Upload;
		this.growl = growl;
		this.AwardService = AwardService;
		this.allowToUseType = ['owner', 'friend', 'all'];
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
		    }, () => {
		    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		    });
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}
}

angular.module('healthStarsApp').controller('CreateAwardCtrl', CreateAwardCtrl);