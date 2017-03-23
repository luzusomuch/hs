'use strict';

(function() {

  function LikeService($http, APP_CONFIG) {
    return {
      checkLiked(objectId, objectName) {
        return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/likes/${objectId}/${objectName}/check`);
      },

      likeOrDislike(objectId, objectName) {
      	return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/likes`, {objectId: objectId, objectName: objectName});
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('LikeService', LikeService);
})();
