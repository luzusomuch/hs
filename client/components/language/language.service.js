'use strict';
class Language {
	constructor($http, APP_CONFIG, $localStorage, $translate) {
		this.$http = $http;
		this.APP_CONFIG = APP_CONFIG;
		this.$translate = $translate;
		this.$localStorage = $localStorage;
	}

	set(lang) {
		delete this.$localStorage.language;
		this.$localStorage.language = lang;
		this.$translate.use(lang);
	}

}

angular.module('healthStarsApp.language', ['healthStarsApp.constants', 'ngStorage', 'pascalprecht.translate'])
.config((APP_CONFIG, $translateProvider) => {
	$translateProvider.useUrlLoader(`${APP_CONFIG.APIConnection}api/${APP_CONFIG.apiVer}/langs`);
	$translateProvider.useSanitizeValueStrategy('sanitize');
})
.factory('Language', function($http, APP_CONFIG, $localStorage, $translate) {
	return new Language($http, APP_CONFIG, $localStorage, $translate);
});