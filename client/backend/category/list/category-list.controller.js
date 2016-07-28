'use strict';

class BackendCategoryListCtrl {
	constructor($scope, $localStorage, categories) {
		this.authUser = $localStorage.authUser;
		this.categories = categories;
		console.log(this.categories);
	}
}

angular.module('healthStarsApp').controller('BackendCategoryListCtrl', BackendCategoryListCtrl);