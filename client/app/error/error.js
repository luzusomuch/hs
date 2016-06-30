'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('404', {
    url: '/404',
    templateUrl: 'app/error/404.html',
    settings: {
      header: false,
      footer: false,
      pageTitle: 'HealthStars | Page not found'
    }
  });
});
