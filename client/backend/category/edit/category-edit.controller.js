'use strict';

class BackendEditCategoryCtrl {
	constructor($scope, category, $uibModalInstance, Upload, $cookies, growl) {
		$scope.category = category;
		$scope.category.newType = angular.copy(category.type);
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
		      		url: '/api/v1/categories/'+category._id,
		      		method: 'PUT',
		      		arrayKey: '',
		      		data: {file: $scope.file, category: $scope.category},
		      		headers: {'Authorization': `Bearer ${$cookies.get('token')}`}
			    }).then(resp =>{
					$uibModalInstance.close(resp.data);
			    }, () => {
			    	growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    });
			} else {
				growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
			}
		};
	}
}

angular.module('healthStarsApp').controller('BackendEditCategoryCtrl', BackendEditCategoryCtrl);