'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants', 'healthStarsApp.util',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage', 
    'healthStarsApp.language', 'ui.select', 'ngFileUpload', 'healthStarsApp.photoViewer', 
    'internationalPhoneNumber', 'masonry', 'slick', 'ngDraggable', 'monospaced.qrcode', 'ngScrollbars', 
    'angular-smilies', 'gm.datepickerMultiSelect', 'ui.calendar'
  ])
  .config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider, growlProvider) {
    $urlRouterProvider.otherwise('/');
    cfpLoadingBarProvider.includeSpinner = false;
    $locationProvider.html5Mode(true);
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
  .run(function($rootScope, $state, Auth, AppSettings, $localStorage, Language, $window) {
    $rootScope.backgroundAvailable = ['login', 'register', 'verifyAccount', 'forgotPw', 'resetPw', 'terms'];
    let lang = $localStorage.language || 'en';
    Language.set(lang);

    window.fbAsyncInit = function() {
      FB.init({
        appId      : AppSettings.get('apiKey')['fbAppId'],
        xfbml      : true,
        status    : true,
        cookie    : true,
        version    : 'v2.6'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = '//connect.facebook.net/en_US/sdk.js';
       fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    WL.init({
      client_id: AppSettings.get('apiKey')['hotmailId'],
      redirect_uri: AppSettings.get('apiKey')['hotmailCallbackUrl'],
      scope: ['wl.basic', 'wl.contacts_emails'],
      response_type: 'token'
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

    $rootScope.pageWidth = $window.innerWidth;
    angular.element($window).bind('resize', function () {
      $rootScope.pageWidth = $window.innerWidth;
      var div1 = $('#div-1');
      var parent = div1.parent();
      if (($rootScope.pageWidth <= 767) && ($rootScope.pageWidth >= 320)) {
        parent.append(div1);
      }
      else {
        parent.prepend(div1);
      }
    });
  });
