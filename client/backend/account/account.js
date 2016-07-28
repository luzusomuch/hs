'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.login', {
      url: '/login',
      templateUrl: 'backend/account/login/login.html',
      controller: 'LoginCtrl',
      controllerAs: 'vm',
      settings: {
        footer: false,
        header: false,
        pageTitle: 'HealthStars Backend | Login'
      }
    })
    .state('backend.logout', {
      url: '/logout?referrer',
      referrer: 'backend.login',
      template: '',
      controller: function($state, Auth) {
        var referrer = $state.params.referrer || $state.current.referrer || 'backend.login';
        Auth.logout();
        $state.go(referrer);
      }
    })
    .state('backend.forgotPw', {
        url: '/forgotpw',
        templateUrl: 'backend/account/forgotpw/forgotpw.html',
        controller: 'ForgotPwCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars Backend | Forgot Password'
        }
      });
  })
  .run(function($rootScope) {
    $rootScope.$on('$stateChangeStart', function(event, next, nextParams, current) {
      if (next.name === 'logout' && current && current.name && !current.authenticate) {
        next.referrer = current.name;
      }
    });
  });
