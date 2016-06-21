'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('main', {
    url: '/',
    templateUrl: 'app/home/home.html',
    controller: HomeCtrl,
    controllerAs: 'vm',
    options: {
    	footer: false,
    	header: true
    }
  });
});
