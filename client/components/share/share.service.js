'use strict';

(function() {

  function ShareService($http, APP_CONFIG) {
    return {
      checkShared(objectId, objectName) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/shares/${objectId}/${objectName}/check`);
      },

      share(objectId, objectName) {
      	return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/shares`, {objectId: objectId, objectName: objectName});
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('ShareService', ShareService);
})();
