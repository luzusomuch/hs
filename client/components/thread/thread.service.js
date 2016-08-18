'use strict';

(function() {

  	function ThreadService($http, APP_CONFIG) {
	    return {

	      	create(data) {
	        	return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads`, data);
	      	},

	      	update: (id, feed) => {
	        	return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/feeds/${id}`, feed);
	      	}
	    };
  	}

  	angular.module('healthStarsApp').factory('ThreadService', ThreadService);
})();
