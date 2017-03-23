'use strict';

(function() {

  function CategoryService($http, APP_CONFIG) {
    return {
      getAll() {
      	return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/categories`);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('CategoryService', CategoryService);
})();
