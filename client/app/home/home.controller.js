'use strict';

class HomeCtrl {

  constructor($http, $scope) {
    this.$http = $http;
    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });
  }
}
