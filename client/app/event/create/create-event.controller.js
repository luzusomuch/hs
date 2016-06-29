'use strict';

class CreateEventCtrl {
	constructor($http, $scope, EventService) {
		this.event = {};
    this.$http = $http;
    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });

    $scope.$watch('vm.event.repeat', (nv) => {
    	if (nv) {
    		
    	}
    });
  }

  create(form) {
  	console.log(this.event);

  }
}

angular.module('healthStarsApp').controller('CreateEventCtrl', CreateEventCtrl);