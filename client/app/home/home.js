'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'app/home/home.html',
    controller: 'HomeCtrl',
    controllerAs: 'vm',
    authenticate: true,
    resolve: {
      categories: function(CategoryService) {
        return CategoryService.getAll().then(resp => {
          return resp.data.items;
        });
      },
      authUser: (Auth) => {
        return Auth.getCurrentUser().then(resp => {
          return resp.data;
        });
      }
    },
    settings: {
    	footer: false,
      pageTitle: 'HealthStars | Home'
    }
  });
});
