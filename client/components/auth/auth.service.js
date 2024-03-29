'use strict';

(function() {

  function AuthService($location, $http, $cookies, $q, APP_CONFIG, Util, User, $localStorage) {
    var safeCb = Util.safeCb;
    var currentUser = {};
    var userRoles = APP_CONFIG.userRoles || [];

    if ($cookies.get('token') && $location.path() !== '/logout') {
      currentUser = User.get();
    }

    var Auth = {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional, function(error, user)
       * @return {Promise}
       */
      login({
        email,
        password
      }, callback) {
        return $http.post('/auth/local', {
            email: email,
            password: password
          })
          .then(res => {
            $cookies.put('token', res.data.token);
            currentUser = User.get();
            return currentUser.$promise;
          })
          .then(user => {
            safeCb(callback)(null, user);
            return user;
          })
          .catch(err => {
            Auth.logout();
            safeCb(callback)(err.data);
            return $q.reject(err.data);
          });
      },

      /**
       * Delete access token and user info
       */
      logout() {
        $cookies.remove('token');
        $localStorage.authUser = null;
        currentUser = {};
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional, function(error, user)
       * @return {Promise}
       */
      createUser(user, callback) {
        return User.save(user).then(resp => {
          // $cookies.put('token', resp.data.token);
          // currentUser = User.get();
          return safeCb(callback)(null, user);
        }).catch(err => {
          Auth.logout();
          return safeCb(callback)(err);
        });
        // , function(data) {
        //   console.log(data);
        //     $cookies.put('token', data.token);
        //     currentUser = User.get().$promise;
        //     console.log(currentUser);
        //     return safeCb(callback)(null, user);
        //   }, function(err) {
        //     Auth.logout();
        //     return safeCb(callback)(err);
        //   });
      },

      /*verify account*/
      verifyAccount(token, callback) {
        return User.verifyAccount({token: token}, (success) => {
          return safeCb(callback)(null, success);
        }, error => {
          return safeCb(callback)(error);
        });
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional, function(error, user)
       * @return {Promise}
       */
      changePassword(oldPassword, newPassword) {
        let deferred = $q.defer();
        $http.put(`/api/${APP_CONFIG.apiVer}/users/${currentUser._id}/password`, {
          oldPassword: oldPassword, newPassword: newPassword
        }).then(resp => {
          return deferred.resolve(resp);
        }).catch(err => {
          return deferred.reject(err);
        });
        return deferred.promise;
      },

      forgotPassword(email) {
        var deferred = $q.defer();
        $http.post(`/api/${APP_CONFIG.apiVer}/auth/forgotpw`, {
          email: email
        }).then(function(response){
          return deferred.resolve(response);
        }, function(error){
          return deferred.reject(error);
        });

        return deferred.promise;
      },

      forgotPasswordCheckToken(token) {
        var deferred = $q.defer();
        $http.get(`/api/${APP_CONFIG.apiVer}/auth/forgotpw/checkToken/${token}`).then(function(response){
          return deferred.resolve(response);
        }, function(error){
          return deferred.reject(error);
        });

        return deferred.promise;
      },

      resetPassword(user) {
        var deferred = $q.defer();
        $http.post(`/api/${APP_CONFIG.apiVer}/auth/resetpw`, user).then(function(response){
          return deferred.resolve(response);
        }, function(error){
          return deferred.reject(error);
        });

        return deferred.promise;
      },

      /**
       * Gets all available info on a user
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, funciton(user)
       * @return {Object|Promise}
       */
      getCurrentUser(callback) {
        if (arguments.length === 0) {
          return currentUser;
        }
        var value = currentUser.hasOwnProperty('$promise') ? currentUser.$promise : currentUser;
        return $q.when(value)
          .then(user => {
            safeCb(callback)(user);
            return user;
          }, () => {
            safeCb(callback)({});
            return {};
          });
      },

      /**
       * Check if a user is logged in
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, function(is)
       * @return {Bool|Promise}
       */
      isLoggedIn(callback) {
        if (arguments.length === 0) {
          return currentUser.hasOwnProperty('role');
        }

        return Auth.getCurrentUser(null)
          .then(resp => {
            var user = resp.data || {};
            var is = user.hasOwnProperty('role');
            $localStorage.authUser = user;
            safeCb(callback)(is);
            return is;
          });
      },

      /**
       * Check if a user has a specified role or higher
       *   (synchronous|asynchronous)
       *
       * @param  {String}     role     - the role to check against
       * @param  {Function|*} callback - optional, function(has)
       * @return {Bool|Promise}
       */
      hasRole(role, callback) {
        var hasRole = function(r, h) {
          return userRoles.indexOf(r) >= userRoles.indexOf(h);
        };

        if (arguments.length < 2) {
          return hasRole(currentUser.role, role);
        }

        return Auth.getCurrentUser(null)
          .then(user => {
            var has = user.hasOwnProperty('role') ? hasRole(user.role, role) : false;
            safeCb(callback)(has);
            return has;
          });
      },

      /**
       * Check if a user is an admin
       *   (synchronous|asynchronous)
       *
       * @param  {Function|*} callback - optional, function(is)
       * @return {Bool|Promise}
       */
      isAdmin() {
        return Auth.hasRole.apply(Auth, [].concat.apply(['admin'], arguments));
      },

      /**
       * Get auth token
       *
       * @return {String} - a token string used for authenticating
       */
      getToken() {
        return $cookies.get('token');
      },

      /*Set localStorage.authUser*/
      setAuthUser(value, type) {
        if (type) {
          return $localStorage.authUser[type] = value;
        } else {
          return $localStorage.authUser = value;
        }
      }
    };

    return Auth;
  }

  angular.module('healthStarsApp.auth')
    .factory('Auth', AuthService);
})();
