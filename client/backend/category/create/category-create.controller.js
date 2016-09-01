'use strict';

class BackendCreateCategoryCtrl {
	constructor($scope, $uibModalInstance, Upload, $cookies, growl) {
		$scope.category = {};
		$scope.submitted = false;
		
		$scope.close = () => {
			$uibModalInstance.dismiss();
		};

		$scope.select = ($file) => {
			$scope.file = $file;
		};

		$scope.submit = (form) => {
			$scope.submitted = true;
			if (form.$valid) {
				Upload.upload({
		      		url: '/api/v1/categories/',
		      		arrayKey: '',
		      		data: {file: $scope.file, category: $scope.category},
		      		headers: {'Authorization': `Bearer ${$cookies.get('token')}`}
		    	}).then(resp =>{
					$uibModalInstance.close(resp.data);
			    }, (err) => {
			    	growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    });
			} else {
				growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
			}
		};
	}
}

angular.module('healthStarsApp').controller('BackendCreateCategoryCtrl', BackendCreateCategoryCtrl);