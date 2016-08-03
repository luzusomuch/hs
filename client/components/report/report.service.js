'use strict';

(function() {

  function ReportService($http, APP_CONFIG) {
  	return {
  		create: (report) => {
  			return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports`, report);
  		},
  		getAll() {
  			return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports/all`);
  		},
      markAsChecked(id) {
        return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/reports/${id}/checked`);
      }
  	};
  }

  angular.module('healthStarsApp')
    .factory('ReportService', ReportService);
})();
