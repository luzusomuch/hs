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
    })
    .state('backend.event.edit', {
      url: '/:id/edit',
      templateUrl: 'backend/event/edit/view.html',
      controller: 'BackendEventEditCtrl',
      controllerAs: 'vm',
      authenticate: true,
      settings: {
        pageTitle: 'HealthStars Backend | Event Edit'
      },
      resolve: {
        event: (EventService, $stateParams) => {
          return EventService.get($stateParams.id).then(
            res => res.data
          );
        }
      } 
    });
  });
