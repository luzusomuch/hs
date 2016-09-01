'use strict';

class BackendCreateAboutContentCtrl {
	constructor(AboutService, $uibModalInstance, growl) {
		this.growl = growl;
		this.AboutService = AboutService;
		this.$uibModalInstance = $uibModalInstance;
		this.page = 1;
		this.about = {};
		this.submitted = false;
		this.languages = [{value: 'en', text: 'English'}, {value: 'de', text: 'German'}];
	}

	close() {
		this.$uibModalInstance.dismiss();
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid) {
			this.AboutService.create(this.about).then(resp => {
				this.$uibModalInstance.close(resp.data);
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}
}

angular.module('healthStarsApp').controller('BackendCreateAboutContentCtrl', BackendCreateAboutContentCtrl);