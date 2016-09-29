'use strict';

(function() {

  function CompanyAccountRequestService($http) {
  	return {
  		list(params) {
  			return $http.get('/api/v1/companyAccountRequests/all', {params: params});
  		},
  		accept: (id) => {
  			return $http.put('/api/v1/companyAccountRequests/'+id);
  		},
  		reject: (id) => {
  			return $http.delete('/api/v1/companyAccountRequests/'+id);
  		}
  	};
  }

  angular.module('healthStarsApp')
    .factory('CompanyAccountRequestService', CompanyAccountRequestService);
})();
