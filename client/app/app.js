'use strict';

angular.module('healthStarsApp', ['healthStarsApp.auth', 'healthStarsApp.constants', 'healthStarsApp.util',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', 'angular-growl', 'angular-loading-bar', 'ngAnimate', 'ngStorage', 
    'healthStarsApp.language', 'ui.select', 'ngFileUpload', 'healthStarsApp.photoViewer', 
    'internationalPhoneNumber', 'masonry', 'slick', 'ngDraggable', 'monospaced.qrcode', 'ngScrollbars', 
    'angular-smilies', 'gm.datepickerMultiSelect', 'ui.calendar', 'ui.timepicker', 'ngImgCrop',
    'ui.toggle'
  ])
  .config(function($urlRouterProvider, $locationProvider, cfpLoadingBarProvider, growlProvider, $provide) {
    $urlRouterProvider.otherwise('/');
    cfpLoadingBarProvider.includeSpinner = false;
    $locationProvider.html5Mode(true);
    growlProvider.globalTimeToLive(3000);
    growlProvider.globalDisableCountDown(true);

    $provide.decorator('$templateRequest', ['$delegate', function($delegate) {
      var fn = $delegate;
      $delegate = function(tpl) {
        for (var key in fn) {
          $delegate[key] = fn[key];
        }
        return fn.apply(this, [tpl, true]);
      };
      return $delegate;
    }]);
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
  .run(function($rootScope, $state, Auth, AppSettings, $localStorage, Language, $window, $http) {
    $rootScope.backgroundAvailable = ['login', 'register', 'verifyAccount', 'forgotPw', 'resetPw', 'terms'];

    if ($localStorage.manualSelectedLanguage) {
      Language.set($localStorage.language);
    } else {
      // set language via location
      let lang;
      navigator.geolocation.getCurrentPosition( position => {
        // $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=52.1939212,10.042791&sensor=true').then(resp => {
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+position.coords.latitude+','+position.coords.longitude+'&sensor=true').then(resp => {
          if (resp.data.status==='OK' && resp.data.results.length > 0) {
            let country = 'en';
            _.each(resp.data.results[0].address_components, item => {
              if (item.types[0]==='country') {
                country = item.short_name.toLowerCase();
              }
            });
            if (country==='de') {
              $localStorage.language = 'de';
              Language.set('de');
            } else {
              $localStorage.language = 'en';
              Language.set('en');  
            }
          } else {
            $localStorage.language = 'en';
            Language.set('en');
          }
        });
      }, () => {
        $localStorage.language = 'en';
        Language.set('en');
      });
    }

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

    gapi.load('auth2', () => {
      window.auth2 = gapi.auth2.init({
        client_id: AppSettings.get('apiKey')['ggAppId'],
        fetch_basic_profile: false,
        scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/user.emails.read https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly profile https://www.googleapis.com/auth/calendar.readonly'
      });
    });
    gapi.load('client', () => {
      gapi.client.load('plus', 'v1');
    });
    
    if (!window.gapi) {
      window.gapi = gapi;
    }

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
      if ($localStorage.language==='de') {
        if (state.name==='register') {
          AppSettings.set('pageTitle', 'HealthStars | Registrierung');
        } else if (state.name==='forgotPw') {
          AppSettings.set('pageTitle', 'HealthStars | Passwort vergessen');
        } else if (state.name==='profile.myCalendar') {
          AppSettings.set('pageTitle', 'HealthStars | Mein Kalender');
        } else if (state.name==='profile.home') {
          AppSettings.set('pageTitle', 'HealthStars | Mein Profil');
        } else if (state.name==='profile.myAward') {
          AppSettings.set('pageTitle', 'HealthStars | Meine Awards');
        } else if (state.name==='profile.myMessages') {
          AppSettings.set('pageTitle', 'HealthStars | Meine Nachrichten');
        } else if (state.name==='profile.detail') {
          AppSettings.set('pageTitle', 'HealthStars | Gesundheitsprofil');
        } else if (state.name==='profile.mySetting') {
          AppSettings.set('pageTitle', 'HealthStars | Einstellungen');
        }
      }

      // show error toast when user not install Adblock ext
      let adBlockEnabled = false;
      let testAd = angular.element('div#detect')[0];
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      angular.element('body')[0].appendChild(testAd);
      window.setTimeout(function() {
        if (testAd.offsetHeight === 0) {
          adBlockEnabled = true;
        }
        testAd.remove();
        
      }, 100);
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

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  step: 5,
  show2400: true,
  timeFormat: 'H:i'
});
