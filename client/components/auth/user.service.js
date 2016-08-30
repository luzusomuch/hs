'use strict';

(function() {

  function UserResource($http, APP_CONFIG) {
    return {
      get(id) {
        id = id || 'me';
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}`);
      },

      list: (params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users`, {params: params});
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

      getFriends: (id, page) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}/friends/${page}`);
      },

      myDashboard: (params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/my-dashboard`, {parmas: params});
      },

      updateProfile: (data) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/profile`, data);
      },

      changeNotificationsSetting: (data) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/notifications-setting`, data);
      },

      addSocialAccount: (data) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/add-social-account`, data);
      },

      deleteAccount: (id) => {
        return $http.delete(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/users/${id}`);
      }
    };
  }

  angular.module('healthStarsApp.auth')
    .factory('User', UserResource);
})();
