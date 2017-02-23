'use strict';

angular.module('healthStarsApp').config(function($stateProvider) {
  $stateProvider.state('terms', {
    url: '/terms',
    templateUrl: 'app/footer-link/terms.html',
  }).state('privacy', {
    url: '/privacy',
    templateUrl: 'app/footer-link/privacy.html',
  }).state('contact', {
    url: '/contact',
    templateUrl: 'app/footer-link/contact.html',
  });
});
