'use strict';

(function() {

  function AboutService($http, APP_CONFIG, $localStorage) {
  	let language = $localStorage.language || 'en';
    return {
      get() {
        return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/abouts/${language}`);
      },

      getAll(params) {
      	return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/abouts/all`, {params: params});
      },

      create: (about) => {
        return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/abouts`, about);
      },

      update: (id, about) => {
        return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/abouts/${id}`, about);
      },

      delete(id) {
        return $http.delete(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/abouts/${id}`);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('AboutService', AboutService);
})();
