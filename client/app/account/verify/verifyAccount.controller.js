'use strict';

class VerifyAccountCtrl {
  constructor(Auth, $state, $timeout) {
    this.error = false;
    console.log($state.params);
    if (!$state.params.token) {
    	this.error = true;
    }
    Auth.verifyAccount($state.params.token).then(success => {
    	this.success = true;
    	$timeout( () => {
    		$state.go('home');
    	}, 4000);
    }).catch(error => {
    	this.error = true;
    	$timeout( () => {
    		$state.go('home');
    	}, 4000);
    });
  }
}

angular.module('healthStarsApp').controller('VerifyAccountCtrl', VerifyAccountCtrl);
