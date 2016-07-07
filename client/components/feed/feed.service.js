'use strict';

(function() {

  function FeedService($http, APP_CONFIG) {
    return {

      getAllByEventId(id, params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}/event`, {params: params});
      },

      update: (id, feed) => {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}`, feed);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('FeedService', FeedService);
})();
