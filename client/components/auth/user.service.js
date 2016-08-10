'use strict';

(function() {

  function UserResource($http, APP_CONFIG) {
    return {
      get(id) {
        id = id || 'me';
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}`);
      },

      save: (user) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users`, user);
      },

      verifyAccount: (token) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/verify-account`, token);
      },

      changeExhibit: (data) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/changeExhibit`, data);
      },

      getInfo: (id) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}/info`);
      },

      getFriends: (page) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/friends/${page}`);
      },

      updateProfile: (data) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/profile`, data);
      }
    };
  }

  angular.module('healthStarsApp.auth')
    .factory('User', UserResource);
})();
