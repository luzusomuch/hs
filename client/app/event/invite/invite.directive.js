'use strict';

class EventInviteCtrl {
	constructor($uibModal) {
		this.loading = true;
	}
}

angular.module('healthStarsApp').directive('hsEventInvite', ($uibModal) => {
	return {
		restrict: 'A',
		scope: {
			eId : '='
		},
		link: function(scope, elm) {
			var func =  function(e){
				e.preventDefault();
				$uibModal.open({
					templateUrl: 'app/event/invite/invite.html',
					controller: 'EventInviteCtrl'
				})
			};

			elm.bind('click', func);
			scope.$on('$destroy', function(){
				elm.unbind('click', func);
			});
		}
	};
}).controller('EventInviteCtrl', EventInviteCtrl);