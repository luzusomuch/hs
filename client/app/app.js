'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage', 'healthStarsApp.language', 'ui.select'
  ])
  .config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {
    $urlRouterProvider.otherwise('/home');
    cfpLoadingBarProvider.includeSpinner = false;
    $locationProvider.html5Mode(true);
  })
  .factory('AppSettings', () => {
    let _default = {
      header: true,
      footer: true,
      bodyClass: '',
      pageTitle: 'HealthStars'
    };
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
  .run(function($rootScope, $state, Auth, AppSettings, $localStorage, Language) {
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
    });
  });
