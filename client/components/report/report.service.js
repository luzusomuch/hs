'use strict';

(function() {

  function ReportService($http, APP_CONFIG) {
  	return {
  		create: (report) => {
  			return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports`, report);
  		},
  		getAll(params) {
  			return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports/all`, {params: params});
  		},
      markAsChecked(id) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports/${id}/checked`);
      },
      search(params) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports/search`, {params: params});
      }
  	};
  }

  angular.module('healthStarsApp')
    .factory('ReportService', ReportService);
})();
