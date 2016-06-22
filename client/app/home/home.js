'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('home', {
    url: '/home',
    templateUrl: 'app/home/home.html',
    controller: 'HomeCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
    	footer: false,
      pageTitle: 'HealthStars | Home'
    }
  });
});
