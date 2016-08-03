'use strict';

class BackendCreateAboutContentCtrl {
	constructor(AboutService, $uibModalInstance) {
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
			}).catch(err => {
				console.log(err);
				// TODO show error
			});
		} else {
			// TODO show error
		}
	}
}

angular.module('healthStarsApp').controller('BackendCreateAboutContentCtrl', BackendCreateAboutContentCtrl);