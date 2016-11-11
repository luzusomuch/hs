class BackendEditAwardCtrl {
	constructor($scope, award, $uibModalInstance, $cookies, Upload, growl, friends) {
		friends.unshift({name: ' '});
		$scope.friends = friends;

		$scope.allowToUseTypes = ['owner', 'friend', 'all'];

		$scope.types = [
			{value: 'accepted'}, 
			{value: 'gps'}, 
			{value: 'organizer'}, 
			{value: 'offline'}
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
				if ($scope.award.allowToUseType==='owner' || $scope.award.allowToUseType==='all') {
					$scope.award.allowToUseId = [];
				} else if ($scope.award.allowToUseType==='friend') {
					$scope.award.allowToUseId = _.map($scope.award.allowToUse, '_id');
				}
				
				Upload.upload({
			      	url: '/api/v1/awards/'+$scope.award._id,
			      	arrayKey: '',
			      	method: 'PUT',
			      	data: {file: $scope.file, award: $scope.award},
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

angular.module('healthStarsApp').controller('BackendEditAwardCtrl', BackendEditAwardCtrl);