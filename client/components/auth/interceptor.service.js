'use strict';

(function() {

  function authInterceptor($rootScope, $q, $cookies, $injector, Util, APP_CONFIG) {
    var state;
    return {
      // Add authorization token to headers
      request(config) {
        config.headers = config.headers || {};
        var apiUrl = APP_CONFIG.baseUrl;
        var origins = Util.urlParse(apiUrl);
        if ($cookies.get('token') && Util.isSameOrigin(config.url, origins)) {
          config.headers.Authorization = 'Bearer ' + $cookies.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError(response) {
        if (response.status === 401) {
          (state || (state = $injector.get('$state')))
          .go('login');
          // remove any stale tokens
          $cookies.remove('token');
        }
        return $q.reject(response);
      }
    };
  }

  angular.module('healthStarsApp.auth')
    .factory('authInterceptor', authInterceptor);
})();
