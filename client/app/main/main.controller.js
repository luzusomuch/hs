'use strict';

(function() {

  class MainController {

    constructor($http, $scope) {
      this.$http = $http;

      $scope.$on('$destroy', function() {
        //do anything such as remove socket
      });
    }
  }

  angular.module('meanAppApp')
    .component('main', {
      templateUrl: 'app/main/main.html',
      controller: MainController
    });
})();
