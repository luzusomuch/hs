'use strict';

(function() {

  	function ThreadService($http, APP_CONFIG) {
	    return {

	      	create(data) {
	        	return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads`, data);
	      	},

	      	sendMessage: (id, data) => {
	        	return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/${id}`, data);
	      	},

	      	getMyMessages: (params) => {
	      		return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/my-messages`, {params: params});	
	      	},

	      	messageDetail: (id) => {
	      		return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/${id}`);		
	      	}
	    };
  	}

  	angular.module('healthStarsApp').factory('ThreadService', ThreadService);
})();
