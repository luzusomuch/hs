'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.event', {
      url: '/event',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.event.list', {
    	url: '/all',
    	templateUrl: 'backend/event/list/view.html',
    	controller: 'BackendEventListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Events List'
	    },
	    resolve: {
	    	events: (EventService) => {
	    		return EventService.search().then(resp => {
		    		return resp.data;
	    		});
		    }
	    } 
    });
  });
