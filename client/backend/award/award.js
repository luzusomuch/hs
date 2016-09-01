'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.award', {
      url: '/award',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.award.list', {
    	url: '/all',
    	templateUrl: 'backend/award/list/view.html',
    	controller: 'BackendAwardListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Awards List'
	    }
    });
  });
