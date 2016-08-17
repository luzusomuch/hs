'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars | Login'
        }
      })
      .state('logout', {
        url: '/logout?referrer',
        referrer: 'home',
        template: '',
        controller: function($state, Auth) {
          var referrer = $state.params.referrer || $state.current.referrer || 'home';
          Auth.logout();
          $state.go(referrer);
        }
      })
      .state('register', {
        url: '/register',
        templateUrl: 'app/account/register/register.html',
        controller: 'RegisterCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars | Register'
        }
      })
      .state('verifyAccount', {
        url: '/verify/:token',
        templateUrl: 'app/account/verify/verify.html',
        controller: 'VerifyAccountCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars | Verify Account'
        }
      })
      .state('forgotPw', {
        url: '/forgotpw',
        templateUrl: 'app/account/forgotpw/forgotpw.html',
        controller: 'ForgotPwCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars | Forgot Password'
        }
      }).state('resetPw', {
        url: '/resetpw/:token',
        templateUrl: 'app/account/resetpw/resetpw.html',
        controller: 'ResetPwCtrl',
        controllerAs: 'vm',
        settings: {
          footer: false,
          header: false,
          pageTitle: 'HealthStars | Reset Password'
        },
        resolve: {
          resetData: ['$stateParams', 'Auth', function($stateParams, Auth){
            return Auth.forgotPasswordCheckToken($stateParams.token).then(
              () => {
               return { token: $stateParams.token };
              },
              err => {
                return { error : err.data };
              }
            );
          }],
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
