'use strict';

angular.module('healthStarsApp').directive('hsLoading', () => {
	return {
		restrict: 'E',
		scope: {
			size: '='
		},
		templateUrl: 'components/loading/loading.html',
		link: function(scope) {
			scope.style = {
				display: 'inline-block',
				width: scope.size + 'px',
				height: scope.size + 'px'
			};
			console.log(scope.style);
		}
	};
});
