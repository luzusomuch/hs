'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('terms', {
    url: '/terms',
    templateUrl: 'app/footer-link/terms.html',
    controller: ['$scope', '$localStorage', ($scope, $localStorage) => {
      $scope.$localStorage = $localStorage;
    }]
  }).state('privacy', {
    url: '/privacy',
    templateUrl: 'app/footer-link/privacy.html',
    controller: ['$scope', '$localStorage', ($scope, $localStorage) => {
      $scope.$localStorage = $localStorage;
    }]
  }).state('contact', {
    url: '/contact',
    templateUrl: 'app/footer-link/contact.html',
    controller: ['$scope', '$localStorage', ($scope, $localStorage) => {
      $scope.$localStorage = $localStorage;
    }]
  });
});
