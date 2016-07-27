'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants',
  'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
  'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 
  'healthStarsApp.language'
])
.config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider, $stateProvider) {
  $urlRouterProvider.otherwise('/backend/login');
  cfpLoadingBarProvider.includeSpinner = false;
  $locationProvider.html5Mode(true);
 	$stateProvider.state('backend', {
 		url: '/backend',
 		template: '<ui-view />',
 		abstract: true
 	});
})
.factory('AppSettings', (APP_CONFIG) => {
  let _default = _.merge({
    header: true,
    footer: true,
    bodyClass: '',
    pageTitle: 'HealthStars'
  }, APP_CONFIG);
	let settings = _.extend({}, _default);
	return {
    getDefaultSettings() {
      return _default;
    },

		getSettings() {
			return settings;
		},

		get(key) {
			return settings[key];
		},

		set(key, value) {
			settings[key] = value;
		}
	};
})
.run(function($rootScope, $localStorage, Language, Auth, $location, $timeout) {
	let lang = $localStorage.language || 'en';
  Language.set(lang);

  $rootScope.$on('$stateChangeStart', function(event, next) {
  	Auth.isLoggedIn(logged => {
  		if (logged) {
  			if ($localStorage.authUser._id && $localStorage.authUser.role!=='admin') {
  				Auth.logout();
					$location.path('/backend/login');
  			}
  		} else {
  			$location.path('/backend/login');
  		}
  	});
  });
  $rootScope.$on('$stateChangeSuccess', (event, state) => {
    $rootScope.currentState = state.name;
  });
});
