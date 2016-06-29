'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('event', {
    url: '/event',
    template: '<ui-view/>',
    abstract: true
  }).state('event.create', {
  	url: '/create',
  	templateUrl: 'app/event/create/create-event.html',
  	controller: 'CreateEventCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | Create Event'
    }
  }).state('event.detail', {
    url: '/detail/:id',
    templateUrl: 'app/event/detail/detail.html',
    controller: 'EventDetailCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | Event Detail'
    }
  });
});
