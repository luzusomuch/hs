'use strict';

(function() {

  function ReportService($http) {
  	return {
  		create: (report) => {
  			return $http.post('/api/v1/reports', report);
  		}
  	};
  }

  angular.module('healthStarsApp')
    .factory('ReportService', ReportService);
})();
