'use strict';

(function() {

  function AwardService($http, APP_CONFIG) {
    return {
      get(id) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/${id}`);
      },

      getAll(id, params) {
      	id = id || 'me';
      	return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/${id}/all`, {params: params});
      },

      getGrantedAwards(id) {
        id = id || 'me';
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/${id}/grantedAwards`);
      },

      create: (award) => {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards`, award);
      },

      update: (id, award) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/${id}`, award);
      },

      delete: (id) => {
      	return $http.delete(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/${id}`);
      },

      search: (params) => {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/awards/search`, {params: params});
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('AwardService', AwardService);
})();
