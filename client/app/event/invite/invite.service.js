'use strict';

(function() {

  function InviteService($http, APP_CONFIG) {
    return {
      intiveToEvent(userId, eventId) {
        return $http.post(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/invites/event`, {userId: userId, eventId: eventId});
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('Invite', InviteService);
})();
