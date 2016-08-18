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
  }).state('event.edit', {
    url: '/edit/:id',
    templateUrl: 'app/event/edit/edit-event.html',
    controller: 'EditEventCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | Edit Event'
    },
    resolve: {
      event: (EventService, $stateParams, $location) => {
        if (!$stateParams.id) {
          return $location.path('404');
        }
        return EventService.get($stateParams.id).then(
          res => res.data,
          err => {
            if (err.status !== 401) {
              return $location.path('404');
            }
          }
        );
      },
      categories: (CategoryService, $location) => {
        return CategoryService.getAll().then(resp => {
          return resp.data.items;
        }).catch(() => {
          return $location.path('404');
        }); 
      }
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
          return $location.path('404');
        }
        return EventService.get($stateParams.id).then(
          res => res.data,
          err => {
            if(err.status !== 401) {
              return $location.path('404');
            }
          }
        );
      },
      liked: (LikeService, $stateParams, $location) => {
        if (!$stateParams.id) {
          return $location.path('404');
        }
        return LikeService.checkLiked($stateParams.id, 'Event').then(res => {
          return res.data.liked;
        }).catch(err => {
          if (err.status !== 401) {
            return $location.path('404');
          }
        });
      }
    }
  });
});
