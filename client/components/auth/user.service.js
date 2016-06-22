'use strict';

(function() {

  function UserResource($http, APP_CONFIG) {
    return {
      get(id) {
        id = id || 'me';
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}`);
      },

      create(user) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users`, user);
      }
    };
  }

  angular.module('healthStarsApp.auth')
    .factory('User', UserResource);
})();
