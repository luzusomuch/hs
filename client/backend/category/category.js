'use strict';

angular.module('healthStarsApp')
  .config(function($stateProvider) {
    $stateProvider.state('backend.category', {
      url: '/category',
      template: '<ui-view/>',
    	abstract: true
    })
    .state('backend.category.list', {
    	url: '/all',
    	templateUrl: 'backend/category/list/view.html',
    	controller: 'BackendCategoryListCtrl',
    	controllerAs: 'vm',
    	authenticate: true,
    	settings: {
	      pageTitle: 'HealthStars Backend | Categories List'
	    },
	    resolve: {
	    	categories: (CategoryService) => {
		    	return CategoryService.getAll().then(resp => {
		    		return resp.data.items;
		    	}).catch(() => {
		    		return [];
		    	});
		    }
	    } 
    });
  });
