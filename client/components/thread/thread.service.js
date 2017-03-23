'use strict';

(function() {

  	function ThreadService($http, APP_CONFIG) {
	    return {

	      	create(data) {
	        	return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads`, data);
	      	},

	      	newThreadsInMyMessage(data) {
	        	return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/new-threads`, data);
	      	},

	      	sendMessage: (id, data) => {
	        	return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/${id}`, data);
	      	},

	      	getMyMessages: (params) => {
	      		return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/my-messages`, {params: params});	
	      	},

	      	search: (params) => {
	      		return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/search`, {params: params});	
	      	},

	      	messageDetail: (id) => {
	      		return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/${id}`);		
	      	},

	      	block: (id) => {
	      		return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/${id}/block`);		
	      	},

	      	configReceiveEmail: (id, data) => {
	      		return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/${id}/config-receive-email`, data);			
	      	},

	      	changeTags: (id, data) => {
	      		return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/threads/${id}/change-tags`, data);				
	      	}
	    };
  	}

  	angular.module('healthStarsApp').factory('ThreadService', ThreadService);
})();
