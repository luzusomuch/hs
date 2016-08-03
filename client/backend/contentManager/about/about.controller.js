'use strict';

class BackendContentManagerAboutCtrl {
	constructor(AboutService, $uibModal) {
		this.AboutService = AboutService;
		this.$uibModal = $uibModal;
		this.page = 1;
		this.abouts = {};
		this.loadMore();
	}

	loadMore() {
		this.AboutService.getAll({page: this.page}).then(resp => {
			this.abouts.items = (this.abouts.items) ? this.abouts.items.concat(resp.data.items) : resp.data.items;
			this.abouts.totalItem = resp.data.totalItem;
			this.page +=1;
			console.log(this.abouts);
		});
	}

	create() {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/contentManager/create-about-content/view.html',
    	controller: 'BackendCreateAboutContentCtrl',
    	controllerAs: 'vm'
    });
		modalInstance.result.then(data => {
			this.abouts.items.push(data);
			this.abouts.totalItem +=1;
		}, err => {
			console.log(err);
			// TODO show error
		});
	}

	delete(about) {
		this.AboutService.delete(about._id).then(() => {
			let index = _.findIndex(this.abouts.items, (item) => {
				return item._id===about._id;
			});
			if (index !== 1) {
				this.abouts.items.splice(index, 1);
			}
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	edit(about) {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/contentManager/edit-about-content/view.html',
    	controller: 'BackendEditAboutContentCtrl',
    	controllerAs: 'vm',
    	resolve: {
    		about: () => {
    			return about;
    		}
    	}
    });
		modalInstance.result.then(data => {
			about = data;
		}, err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp').controller('BackendContentManagerAboutCtrl', BackendContentManagerAboutCtrl);