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
    },
    resolve: {
      event: (EventService, $stateParams, $location) => {
        if(!$stateParams.id) {
          $location.path('404');
          return false;
        }
        return EventService.get($stateParams.id).then(
          res => res.data,
          () => $location.path('404')
        );
      }
    }
  });
});
