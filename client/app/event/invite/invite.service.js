'use strict';

(function() {

  	function InviteService($http, APP_CONFIG) {
	    return {
	      	intiveToEvent(userId, eventId) {
	        	return $http.post(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/invites/event`, {userId: userId, eventId: eventId});
	      	},
	      	acceptEventInvite(id) {
	      		return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/invites/${id}`);
	      	},
	      	rejectEventInvite(id) {
	      		return $http.delete(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/invites/${id}`);	
	      	}

	    };
  	}

  	angular.module('healthStarsApp')
    .factory('Invite', InviteService);
})();
