'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.contentManager', {
      url: '/content-manager',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.contentManager.homePage', {
    	url: '/home-page',
    	templateUrl: 'backend/contentManager/homePage/view.html',
    	controller: 'BackendContentManagerHomePageCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Content Manager - Home Page'
	    }
    })
    .state('backend.contentManager.about', {
    	url: '/about',
    	templateUrl: 'backend/contentManager/about/view.html',
    	controller: 'BackendContentManagerAboutCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Content Manager - About'
	    }
    });
});
