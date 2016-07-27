'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.dashboard', {
        url: '/dashboard',
        templateUrl: 'backend/dashboard/dashboard.html'
      });
  });
