class EditAwardCtrl {
	constructor($scope, award, $uibModalInstance, $cookies, Upload, growl) {
		$scope.types = [
			{value: 'accepted', text: 'Award will be granted to every users accepted an event'}, 
			{value: 'gps', text: 'Award will be granted to every users have gps signal send from Healthstars App'}, 
			{value: 'organizer', text: 'Award will be granted by organizer'}, 
			{value: 'offline', text: 'Award will be granted by Healthstars offline (only for company accounts)'}
		];
		$scope.submitted = false;
		$scope.award = angular.copy(award);
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
			    }, () => {
			    	growl.error("<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>");
			    });
			} else {
				growl.error("<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>");
			}
		};
	}
}

angular.module('healthStarsApp').controller('EditAwardCtrl', EditAwardCtrl);