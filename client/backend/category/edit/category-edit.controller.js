'use strict';

class BackendEditCategoryCtrl {
	constructor($scope, category, $uibModalInstance, Upload, $cookies) {
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

angular.module('healthStarsApp').controller('BackendEditCategoryCtrl', BackendEditCategoryCtrl);