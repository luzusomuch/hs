'use strict';

class CropImageCtrl {
	constructor(file, cropType, $uibModalInstance, Upload, $localStorage) {
		this.Upload = Upload;
		this.$uibModalInstance = $uibModalInstance;
		this.file = file[0];
		this.myCroppedImage;
		this.authUser = $localStorage.authUser;
		this.cropType = (cropType) ? cropType : 'circle';
		this.coords = {};
	}

	submit() {
		if (this.myCroppedImage.length > 0) {
			let blob = this.Upload.dataUrltoBlob(this.myCroppedImage);
			blob.coords = this.coords;
			this.$uibModalInstance.close(blob);
		}
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('CropImageCtrl', CropImageCtrl);