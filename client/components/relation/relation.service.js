'use strict';

(function() {

  function RelationService($http, APP_CONFIG) {
    return {
      get(id) {
        return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/${id}`);
      },

      getAll(option, params) {
      	return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/${option.id}/${option.type}`, {params: params});
      },

      create: (relation) => {
        return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations`, relation);
      },

      update: (id, relation) => {
        return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/${id}`, relation);
      },


      delete: (id) => {
        return $http.delete(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/${id}`);
      },

      deleteByUserId: (id) => {
        return $http.delete(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/${id}/user`);
      },

      searchFriends: (data) => {
        return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/search`, data);
      },

      inviteViaEmails: (data) => {
        return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/relations/invite-via-emails`, data);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('RelationService', RelationService);
})();
