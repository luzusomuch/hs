'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
    $stateProvider.state('backend.user', {
      	url: '/users',
      	template: '<ui-view/>',
    	abstract: true
    }).state('backend.user.list', {
    	url: '/all',
    	templateUrl: 'backend/user/list/view.html',
    	controller: 'BackendUsersListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Users List'
	    }
    })
});
