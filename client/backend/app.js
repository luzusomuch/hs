'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants',
  'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
  'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate'
])
.config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider, $stateProvider) {
  $urlRouterProvider.otherwise('/backend/dashboard');
  cfpLoadingBarProvider.includeSpinner = false;
  $locationProvider.html5Mode(true);
 	$stateProvider.state('backend', {
 		url: '/backend',
 		template: '<ui-view />',
 		abstract: true
 	});
});
