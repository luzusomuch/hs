'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.photo', {
      url: '/photo',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.photo.list', {
    	url: '/all',
    	templateUrl: 'backend/photo/list/view.html',
    	controller: 'BackendPhotoListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Photos List'
	    }
    })
  });
