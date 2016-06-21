'use strict';

angular.module('healthStarsApp.auth', ['healthStarsApp.constants', 'healthStarsApp.util', 'ngCookies',
    'ui.router'
  ])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
