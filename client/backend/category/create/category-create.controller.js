'use strict';

class BackendCreateCategoryCtrl {
	constructor($scope, $uibModalInstance, Upload, $cookies) {
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
		    	console.log(err);
		    	// TODO show error
		    });
			} else {
				// TODO show error
			}
		}
	}
}

angular.module('healthStarsApp').controller('BackendCreateCategoryCtrl', BackendCreateCategoryCtrl);