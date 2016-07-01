'use strict';

(function() {

  function EventService($http, APP_CONFIG) {
    return {
      get(id) {
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
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('EventService', EventService);
})();
