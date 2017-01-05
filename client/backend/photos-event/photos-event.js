'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.photosEvent', {
      url: '/photos-event',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.photosEvent.list', {
    	url: '/all',
    	templateUrl: 'backend/photos-event/list/view.html',
    	controller: 'BackendPhotosEventListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Photos Event List'
	    }
    })
    .state('backend.photosEvent.create', {
    	url: '/create',
    	templateUrl: 'backend/photos-event/create/view.html',
    	controller: 'BackendPhotosEventCreateCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Photos Event Create'
	    }
    })
    .state('backend.photosEvent.edit', {
    	url: '/:id/edit',
    	templateUrl: 'backend/photos-event/update/view.html',
    	controller: 'BackendPhotosEventUpdateCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Photos Event Update'
	    },
	    resolve: {
	    	photo: (PhotoService, $stateParams) => {
	    		return PhotoService.getPhotoDetail({id: $stateParams.id});
	    	}
	    }
    });
  });
