'use strict';

class MyCalendarCtrl {
	constructor($scope, $state, $localStorage, APP_CONFIG) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
	}
}

angular.module('healthStarsApp').controller('MyCalendarCtrl', MyCalendarCtrl);