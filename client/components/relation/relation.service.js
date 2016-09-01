'use strict';

(function() {

  function RelationService($http, APP_CONFIG) {
    return {
      get(id) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/${id}`);
      },

      getAll(option, params) {
      	return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/${option.id}/${option.type}`, {params: params});
      },

      create: (relation) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations`, relation);
      },

      update: (id, relation) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/${id}`, relation);
      },


      delete: (id) => {
        return $http.delete(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/${id}`);
      },

      deleteByUserId: (id) => {
        return $http.delete(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/${id}/user`);
      },

      searchFriends: (data) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/relations/search`, data);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('RelationService', RelationService);
})();
