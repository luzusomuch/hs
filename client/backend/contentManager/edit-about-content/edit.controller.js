'use strict';

class BackendEditAboutContentCtrl {
	constructor(AboutService, $uibModalInstance, about) {
		this.AboutService = AboutService;
		this.$uibModalInstance = $uibModalInstance;
		this.page = 1;
		this.about = about;
		this.submitted = false;
		this.languages = [{value: 'en', text: 'English'}, {value: 'de', text: 'German'}];
	}

	close() {
		this.$uibModalInstance.dismiss();
	}

	submit(form) {
		this.submitted = true;
		if (form.$valid) {
			this.AboutService.update(this.about._id, this.about).then(resp => {
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

angular.module('healthStarsApp').controller('BackendEditAboutContentCtrl', BackendEditAboutContentCtrl);