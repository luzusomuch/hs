'use strict';

angular.module('meanAppApp.auth', ['meanAppApp.constants', 'meanAppApp.util', 'ngCookies',
    'ui.router'
  ])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
