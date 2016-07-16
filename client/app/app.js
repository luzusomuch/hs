'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants', 'healthStarsApp.util',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage', 
    'healthStarsApp.language', 'ui.select', 'ngFileUpload', 'healthStarsApp.photoViewer', 
    'internationalPhoneNumber', 'wu.masonry'
  ])
  .config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {
    $urlRouterProvider.otherwise('/');
    cfpLoadingBarProvider.includeSpinner = false;
    $locationProvider.html5Mode(true);
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
  .run(function($rootScope, $state, Auth, AppSettings, $localStorage, Language) {
    let lang = $localStorage.language || 'en';
    Language.set(lang);
    FB.init({
      appId: AppSettings.get('apiKey')['fbAppId'],
      status: true,
      cookie: true,
      xfbml: true
    });
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
    $rootScope.$on('$stateChangeSuccess', (event, state) => {
      $rootScope.currentState = state.name;
    });
  });
