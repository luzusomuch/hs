'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('profile', {
    url: '/profile',
    template: '<ui-view/>',
    abstract: true
  }).state('profile.myCalendar', {
  	url: '/my-calendar',
  	templateUrl: 'app/profile/my-calendar/my-calendar.html',
  	controller: 'MyCalendarCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | My Calendar'
    }
  }).state('profile.myAward', {
    url: '/my-award',
    templateUrl: 'app/profile/my-award/my-award.html',
    controller: 'MyAwardCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | My Award'
    },
    resolve: {
      grantedAwards: (AwardService, $location) => {
        return AwardService.getGrantedAwards().then(
          res => res.data,
          err => {
            if (err.status !== 401) {
              return $location.path('404');
            }
          }
        );
      },
      ownAwards: (AwardService, $location) => {
      	return AwardService.getAll().then(
      		res => res.data,
      		err => {
      			if (err.status !== 401) {
      				return $location.path('404');
      			}
      		}
    		);
      }
    }
  });
});
