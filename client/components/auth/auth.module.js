'use strict';

angular.module('healthStarsApp.auth', ['healthStarsApp.constants', 'healthStarsApp.util', 'ngCookies',
    'ui.router', 'ngStorage'
  ])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
