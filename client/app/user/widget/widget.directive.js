'use strict';

class UserWidgetCtrl {
	constructor($scope, $rootScope, User, APP_CONFIG, $cookies, Upload, $uibModal, growl, Auth) {
		this.$rootScope = $rootScope;
		this.$cookies = $cookies;
		this.Upload = Upload;
		this.$uibModal =$uibModal;
		this.growl = growl;
		this.Auth = Auth;
		this.link = APP_CONFIG.baseUrl + 'profile/' + $scope.uId + '/detail';
		this.user = {};
		this.hideAwardExhibit = $scope.hideAwardExhibit;
		this.currentUser = $scope.currentUser;
			
		$scope.$watch('uId', nv => {
			if(nv) {
				User.getInfo($scope.uId).then(
					res => {
						this.user = res.data;
					}
				);
			}
		});
	}

	upload(file, type) {
		// If user upload avatar then open a modal to resize(crop image)
		if (this.currentUser && this.currentUser._id.toString()===this.user._id.toString()) {
			if (file && file.length > 0) {
				this.$uibModal.open({
					animation: true,
					templateUrl: 'app/profile/modal/crop-image/view.html',
					controller: 'CropImageCtrl',
					controllerAs: 'CropImage',
					resolve: {
						file: () => {
							return file;
						},
						cropType: () => {
							return 'circle';
						},
						imageSize: () => {
							return {};
						},
          				isBanner: () => {
	            			return false;
	          			}
					}
				}).result.then(data => {
					this.Upload.upload({
				      	url: '/api/v1/users/change-picture',
				      	arrayKey: '',
				      	data: {file: data, type: type},
				      	headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
			    	}).then(resp =>{
			    		this.user[resp.data.type] = resp.data.photo;
			    		this.Auth.setAuthUser(this.user);
			    		this.$rootScope.$broadcast('update-user-profile');
			    	}, () => {
			    		this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			    	});
				});
			}
		} else {
			this.growl.error(`<p>{{'NOT_ALLOW' | translate}}</p>`);
		}
	}
}

angular.module('healthStarsApp').directive('hsUserWidget', () => {
	return {
		restrict: 'E',
		scope: {
			uId : '=',
			currentUser: '=',
			hideAwardExhibit: '@'
		},
		templateUrl: 'app/user/widget/widget.html',
		controller: 'UserWidgetCtrl',
		controllerAs: 'vm',
		replace: true
	};
}).controller('UserWidgetCtrl', UserWidgetCtrl);