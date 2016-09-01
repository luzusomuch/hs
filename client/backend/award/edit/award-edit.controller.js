class BackendEditAwardCtrl {
	constructor($scope, award, $uibModalInstance, $cookies, Upload, growl) {
		$scope.types = [
			{value: 'accepted'}, 
			{value: 'gps'}, 
			{value: 'organizer'}, 
			{value: 'offline'}
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
			    	growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    });
			} else {
				growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
			}
		};
	}
}

angular.module('healthStarsApp').controller('BackendEditAwardCtrl', BackendEditAwardCtrl);