'use strict';

(function() {

  function EventService($http, APP_CONFIG) {
    return {

      getFriendsEvents(params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/friendsEvents`, {params: params});
      },

      getJoinedEvents(params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/joined`, {params: params});
      },

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

      myUpcomingEvents: (params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/upcoming-event`, {params: params});
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

      getParticipants: (id, params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/participants`, {params: params});
      },

      getWaitingParticipants: (id, params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/waiting-participants`, {params: params});
      },

      getBestPics: (id, limit) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/bestPics/${limit}`);
      },

      banUser(id, userId) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/banUser`, {userId: userId});
      },

      grantAward(id, userId) {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/grantAward`, {userId: userId});
      },

      getUserEvent(params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/user-events`, {params: params});
      },

      attendEvent(id) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/attend`);
      },

      leaveEvent(id) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/leave`);
      },

      syncEvents(data) {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/sync-events`, data);
      },

      getAllUsersOfEvent(id) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/all-users-of-event`);
      },

      passAdminRole(id, data) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/events/${id}/pass-admin-role`, data);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('EventService', EventService);
})();
