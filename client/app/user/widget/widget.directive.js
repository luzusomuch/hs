'use strict';

class UserWidgetCtrl {
	constructor($scope, User) {
		this.user = {};
		if($scope.uId) {
			User.getInfo($scope.uId).then(
				res => this.user = res.data
			);
		}
	}
}

angular.module('healthStarsApp').directive('hsUserWidget', () => {
	return {
		restrict: 'E',
		scope: {
			uId : '='
		},
		templateUrl: 'app/user/widget/widget.html',
		controller: 'UserWidgetCtrl',
		controllerAs: 'vm',
		replace: true
	};
}).controller('UserWidgetCtrl', UserWidgetCtrl);