'use strict';

(function() {

  function EventService($http, APP_CONFIG) {
    return {

      search: (body) => {
        body = body || {};
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/search`, body);
      },

      suggest: (value) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/suggest?keyword=${value}`);
      },

      get: (id) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}`);
      },

      create: (event) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events`, event);
      },

      update: (id, event) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}`, event);
      },

      delete: (id) => {
      	return $http.delete(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}`);
      },

      getRelatedEvents: (id) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/related`);
      },

      getParticipants: (id) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/participants`);
      },

      getBestPics: (id, limit) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/bestPics/${limit}`);
      },

      banUser(id, userId) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/banUser`, {userId: userId});
      },

      grantAward(id, userId) {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/grantAward`, {userId: userId});
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('EventService', EventService);
})();
