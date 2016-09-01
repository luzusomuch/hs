'use strict';

class BackendCategoryListCtrl {
	constructor($scope, categories, CategoryService, $uibModal, growl) {
		this.growl = growl;
		this.categories = categories;
		this.CategoryService = CategoryService;
		this.$uibModal = $uibModal;
	}

	edit(cat) {
		let modalInstance = this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'backend/category/edit/edit.html',
	    	controller: 'BackendEditCategoryCtrl',
	    	resolve: {
	    		category: () => {
	    			return cat;
	    		}
	    	}
	    });
		modalInstance.result.then(data => {
			let index = _.findIndex(this.categories, (category) => {
				return category._id===cat._id;
			});
			if (index !== -1) {
				this.categories[index] = data;
				this.growl.success(`<p>{{'UPDATE_CATEGORY_SUCCESSFULLY' | translate}}</p>`);
			}
		});
	}

	create() {
		let modalInstance = this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'backend/category/create/create.html',
	    	controller: 'BackendCreateCategoryCtrl'
	    });
		modalInstance.result.then(data => {
			this.categories.push(data);
			this.growl.success(`<p>{{'CREATE_CATEGORY_SUCCESSFULLY' | translate}}</p>`);
		});
	}
}

angular.module('healthStarsApp').controller('BackendCategoryListCtrl', BackendCategoryListCtrl);