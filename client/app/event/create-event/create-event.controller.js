'use strict';

class CreateEventCtrl {
	constructor($http, $scope) {
    this.$http = $http;
    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });
  }
}

angular.module('healthStarsApp').controller('CreateEventCtrl', CreateEventCtrl);