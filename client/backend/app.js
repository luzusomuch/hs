'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants',
  'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
  'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 
  'healthStarsApp.language', 'ngFileUpload', 'ui.select', 'ui.timepicker'
])
.config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider, $stateProvider, growlProvider) {
  $urlRouterProvider.otherwise('/backend/login');
  cfpLoadingBarProvider.includeSpinner = false;
  $locationProvider.html5Mode(true);
 	$stateProvider.state('backend', {
 		url: '/backend',
 		template: '<ui-view />',
 		abstract: true
 	});
  growlProvider.globalTimeToLive(3000);
  growlProvider.globalDisableCountDown(true);
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
.run(function($rootScope, $localStorage, Language, Auth, $location, $timeout, AppSettings) {
	let lang = $localStorage.language || 'en';
  Language.set(lang);
  $rootScope.appSettings = AppSettings;

  $rootScope.$on('$stateChangeStart', function(event, next) {
    for(let key in AppSettings.getSettings()) {
      if(next.settings && next.settings.hasOwnProperty(key)) {
        AppSettings.set(key, next.settings[key]);
      } else {
        let _default = AppSettings.getDefaultSettings();
        AppSettings.set(key, _default[key]);
      }
    }
  	Auth.isLoggedIn(logged => {
  		if (logged) {
  			if ($localStorage.authUser._id && $localStorage.authUser.role!=='admin') {
  				Auth.logout();
					$location.path('/backend/login');
  			} else {
          
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
