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

	      	search: (params) => {
	      		return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/search`, {params: params});	
	      	},

	      	messageDetail: (id) => {
	      		return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/${id}`);		
	      	},

	      	block: (id) => {
	      		return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/threads/${id}/block`);		
	      	}
	    };
  	}

  	angular.module('healthStarsApp').factory('ThreadService', ThreadService);
})();
