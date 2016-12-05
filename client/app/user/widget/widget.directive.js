'use strict';

class UserWidgetCtrl {
	constructor($scope, User, APP_CONFIG) {
		this.link = APP_CONFIG.baseUrl + 'profile/' + $scope.uId + '/detail';
		this.user = {};
		this.hideAwardExhibit = $scope.hideAwardExhibit;
			
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
}

angular.module('healthStarsApp').directive('hsUserWidget', () => {
	return {
		restrict: 'E',
		scope: {
			uId : '=',
			hideAwardExhibit: '@'
		},
		templateUrl: 'app/user/widget/widget.html',
		controller: 'UserWidgetCtrl',
		controllerAs: 'vm',
		replace: true
	};
}).controller('UserWidgetCtrl', UserWidgetCtrl);