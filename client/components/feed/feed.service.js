'use strict';

(function() {

  function FeedService($http, APP_CONFIG) {
    return {

      getAll(id, type, params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}/${type}`, {params: params});
      },

      update: (id, feed) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}`, feed);
      },

      block: (id) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}/block`);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('FeedService', FeedService);
})();
