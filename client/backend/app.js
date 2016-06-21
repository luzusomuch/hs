'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.admin', 'healthStarsApp.constants',
  'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
  'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate'
])
.config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {
  $urlRouterProvider.otherwise('/');
  cfpLoadingBarProvider.includeSpinner = false;
  $locationProvider.html5Mode(true);
});
