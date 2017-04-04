'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  	$stateProvider.state('about', {
	    url: '/about',
	    templateUrl: 'app/about/view.html',
	    controller: 'AboutCtrl',
	    controllerAs: 'vm',
	    resolve: {
	    	about: (AboutService, $location) => {
	    		return AboutService.get().then(resp => {
	    			return resp.data;
	    		}).catch(() => {
	    			return $location.path('404');
	    		});
	    	}
	    },
	    settings: {
      	pageTitle: 'HealthStars | About'
	    }
  	});
});
