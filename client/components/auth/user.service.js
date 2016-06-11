'use strict';

(function() {

  function UserResource($resource) {
    return $resource('/api/v1/users/:id/:controller', {
      id: '@_id'
    }, {
      changePassword: {
        method: 'PUT',
        params: {
          controller: 'password'
        }
      },
      get: {
        method: 'GET',
        params: {
          id: 'me'
        }
      }
    });
  }

  angular.module('meanAppApp.auth')
    .factory('User', UserResource);
})();
