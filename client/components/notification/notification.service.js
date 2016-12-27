'use strict';

(function() {

  function NotificationService($http, APP_CONFIG) {
    return {
      getTotalNotifications(id) {
        return $http.get(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/notifications/get-total-notifications`);
      },

      markAllAsRead() {
      	return $http.put(`${APP_CONFIG.baseUrl}api/${APP_CONFIG.apiVer}/notifications/mark-all-as-read`);
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('NotificationService', NotificationService);
})();
