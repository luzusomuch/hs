'use strict';

(function() {

  function NotificationService($http, APP_CONFIG) {
    return {
      getTotalNotifications() {
        return $http.get(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/notifications/get-total-notifications`);
      },

      markAllAsRead() {
      	return $http.put(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/notifications/mark-all-as-read`);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('NotificationService', NotificationService);
})();
