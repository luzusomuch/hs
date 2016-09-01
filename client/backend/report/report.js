'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.report', {
      url: '/report',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.report.list', {
    	url: '/all',
    	templateUrl: 'backend/report/list/view.html',
    	controller: 'BackendReportListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Reports List'
	    }
    });
  });
