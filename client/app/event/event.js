'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('event', {
    url: '/event',
    template: '<ui-view/>',
    abstract: true
  }).state('event.create', {
  	url: '/create',
  	templateUrl: 'app/event/create-event/create-event.html',
  	controller: 'CreateEventCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | Create Event'
    }
  });
});
