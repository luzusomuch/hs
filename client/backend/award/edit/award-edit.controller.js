class BackendEditAwardCtrl {
	constructor($scope, award, $uibModalInstance, $cookies, Upload) {
		$scope.types = [
			{value: 'accepted', text: 'Award will be granted to every users accepted an event'}, 
			{value: 'gps', text: 'Award will be granted to every users have gps signal send from Healthstars App'}, 
			{value: 'organizer', text: 'Award will be granted by organizer'}, 
			{value: 'offline', text: 'Award will be granted by Healthstars offline (only for company accounts)'}
		];
		$scope.submitted = false;
		$scope.award = award;
		$scope.file = {};

		$scope.closeModal = () => {
			$uibModalInstance.dismiss();
		};

		$scope.select = ($file) => {
			$scope.file = $file;
		};

		$scope.submit = (form) => {
			$scope.submitted = true;
			if (form.$valid) {
				Upload.upload({
		      url: '/api/v1/awards/'+$scope.award._id,
		      arrayKey: '',
		      method: 'PUT',
		      data: {file: $scope.file, award: $scope.award},
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
		};
	}
}

angular.module('healthStarsApp').controller('BackendEditAwardCtrl', BackendEditAwardCtrl);