'use strict';

class CropImageCtrl {
	constructor($scope, file, cropType, imageSize, $uibModalInstance, Upload, $localStorage) {
		this.Upload = Upload;
		this.$uibModalInstance = $uibModalInstance;
		this.file = file[0];
		this.myCroppedImage;
		this.authUser = $localStorage.authUser;
		this.cropType = (cropType) ? cropType : 'circle';
		this.imageSize = (imageSize.width) ? {w: imageSize.width, h: 250} : {w:200, h:200};
		if (imageSize && imageSize.height) {
			this.imageSize.h = imageSize.height;
		}
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