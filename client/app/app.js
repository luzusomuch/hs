'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage'
  ])
  .config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {
    $urlRouterProvider.otherwise('/');
    cfpLoadingBarProvider.includeSpinner = false;
    $locationProvider.html5Mode(true);
  })
  .run(function($rootScope, $state, Auth) {
      $rootScope.$on('$stateChangeStart', function(event, next) {
      	console.log('state change start'); 
      });
    });
