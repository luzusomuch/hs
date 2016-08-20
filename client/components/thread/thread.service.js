'use strict';

(function() {

  	function ThreadService($http, APP_CONFIG) {
	    return {

	      	create(data) {
	        	return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads`, data);
	      	},

	      	update: (id, feed) => {
	        	return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/${id}`, feed);
	      	},

	      	getMyMessages: (params) => {
	      		return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/my-messages`, {params: params});	
	      	}
	    };
  	}

  	angular.module('healthStarsApp').factory('ThreadService', ThreadService);
})();
