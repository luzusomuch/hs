'use strict';

class EventBestPicsCtrl {
	constructor($scope, EventService, $filter, PhotoViewer, $localStorage) {
		this.bestPics = [];
		this.photoFilter = $filter('imageUrl');
		this.viewer = PhotoViewer;
		this.eventId = $scope.eId;
		this.eventOwner = $scope.eOwner;
		this.authUser = $localStorage.authUser;
		$scope.$watch('eId', (nv) => {
			if(nv) {
				let limit = $scope.limit || 4;
				if(limit > 10) {
					limit = 10;
				}
				EventService.getBestPics(nv, limit).then(
					res => this.bestPics = res.data
				);
			}
		});
	}

	viewPhoto(photo) {
		this.viewer.setPhoto(photo, {
			type: 'bestPics',
			tid: this.eventId
		});
		this.viewer.toggle(true);
	}

}

angular.module('healthStarsApp').directive('hsEventBestPics', () => {
	return {
		restrict: 'E',
		scope: {
			eId : '=',
			limit: '=',
			eOwner: '='
		},
		templateUrl: 'app/event/best-pics/best-pics.html',
		controller: 'EventBestPicsCtrl',
		controllerAs: 'vm',
		replace: true,
		link: function() {}
	};
}).controller('EventBestPicsCtrl', EventBestPicsCtrl);