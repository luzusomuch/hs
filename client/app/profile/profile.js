'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('profile', {
    url: '/profile',
    template: '<ui-view/>',
    abstract: true
  }).state('profile.home', {
    url: '/',
    templateUrl: 'app/profile/my-home/view.html',
    controller: 'MyHomeCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | My Profile'
    }
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
  }).state('profile.mySetting', {
    url: '/my-setting',
    templateUrl: 'app/profile/my-setting/my-setting.html',
    controller: 'MySettingCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | My Setting'
    }
  }).state('profile.detail', {
    url: '/:id/detail',
    templateUrl: 'app/profile/detail/view.html',
    controller: 'ProfileDetailCtrl',
    controllerAs: 'vm',
    authenticate: true,
    settings: {
      pageTitle: 'HealthStars | Profile Detail'
    },
    resolve: {
      user: (User, $stateParams, $location) => {
        return User.getInfo($stateParams.id).then(
          res => {
            if ((res.data.blocked && res.data.blocked.status) || (res.data.deleted && res.data.deleted.status)) {
              return $location.path('404');
            } else {
              return res.data;
            }
          },
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
