'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants', 'healthStarsApp.util',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage', 
    'healthStarsApp.language', 'ui.select', 'ngFileUpload', 'healthStarsApp.photoViewer', 
    'internationalPhoneNumber', 'masonry', 'slick', 'ngDraggable', 'monospaced.qrcode'
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
    $rootScope.backgroundAvailable = ['login', 'register', 'verifyAccount', 'forgotPw', 'resetPw', 'terms'];
    let lang = $localStorage.language || 'en';
    Language.set(lang);
    // FB.init({
    //   appId: AppSettings.get('apiKey')['fbAppId'],
    //   status: true,
    //   cookie: true,
    //   xfbml: true
    // });
    window.fbAsyncInit = function() {
      FB.init({
        appId      : AppSettings.get('apiKey')['fbAppId'],
        xfbml      : true,
        status    : true,
        cookie    : true,
        version    : 'v2.1'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

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
