'use strict';

class VerifyAccountCtrl {
  constructor(Auth, $state, $timeout) {
    this.error = false;
    if (!$state.params.token) {
    	this.error = true;
    }
    Auth.verifyAccount($state.params.token).then(() => {
    	this.success = true;
    	$timeout( () => {
    		$state.go('home');
    	}, 4000);
    }).catch(() => {
    	this.error = true;
    	$timeout( () => {
    		$state.go('home');
    	}, 4000);
    });
  }
}

angular.module('healthStarsApp').controller('VerifyAccountCtrl', VerifyAccountCtrl);
