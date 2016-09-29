'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('backend.companyAccountRequest', {
  	url: '/company-request',
  	template: '<ui-view/>',
  	abstract: true
  }).state('backend.companyAccountRequest.list', {
  	url: '/all',
  	templateUrl: 'backend/company-account-request/list/view.html',
  	controller: 'BackendCompanyAccountRequestListCtrl',
  	controllerAs: 'vm',
  	authenticate: true,
  	settings: {
      pageTitle: 'HealthStars Backend | Company Account Requests List'
    }
  });
});
