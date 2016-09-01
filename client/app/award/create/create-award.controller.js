class CreateAwardCtrl {
	constructor($uibModalInstance, $cookies, Upload, growl, AwardService, friends) {
		this.submitted = false;
		friends.unshift({name: ' '});
		this.friends = friends;
		this.types = [
			{value: 'accepted'}, 
			{value: 'gps'}, 
			{value: 'organizer'}, 
			{value: 'offline'}
		];
		
		this.file = {};
		this.$uibModalInstance = $uibModalInstance;
		this.$cookies = $cookies;
		this.Upload = Upload;
		this.growl = growl;
		this.AwardService = AwardService;
		this.allowToUseTypes = ['owner', 'friend', 'all'];

		this.award = {
			allowToUse: [],
			allowToUseType: this.allowToUseTypes[0]
		};
	}

	select($file) {
  		this.file = $file;
  	}

	submit(form) {
		if (form.$valid && this.file.name && this.award.type) {
			if (this.award.allowToUseType==='owner' || this.award.allowToUseType==='all') {
				this.award.allowToUseId = [];
			} else if (this.award.allowToUseType==='friend') {
				this.award.allowToUseId = _.map(this.award.allowToUse, '_id');
			}

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