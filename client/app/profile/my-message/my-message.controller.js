'use strict';

class MyMessagesCtrl {
	constructor($scope, $localStorage, $state, ThreadService, $uibModal, growl) {
		this.growl = growl;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.$uibModal = $uibModal;
		this.threads = {
			page: 1,
			pageSize: 5
		};
		this.currentPage = 1;
		this.searchQuery = {};
		this.getItems();

		$scope.$watch('vm.searchTerm', (nv) => {
			if (!nv || (nv && nv.length===0)) {
				this.searchQuery.search = false;
			}
		});
	}

	getItems() {
		this.ThreadService.getMyMessages({page: this.threads.page, pageSize: this.threads.pageSize}).then(resp => {
			this.threads.items = resp.data.items;
			this.threads.totalItem = resp.data.totalItem;
		});
	}

	search(searchTerm) {
		if (searchTerm && searchTerm.trim().length > 0) {
			this.searchQuery.search = true;
			this.ThreadService.search({query: searchTerm}).then(resp => {
				this.searchQuery.items = resp.data.items;
			});
		}
	}

	compose() {
		let modalInstance = this.$uibModal.open({
			animation: true,
			templateUrl: 'app/profile/modal/new-thread/view.html',
			controller: 'NewThreadCtrl',
			controllerAs: 'NewThread',
			resolve: {
				friends: (User) => {
					return User.getFriends(this.authUser._id, {getAll: true}).then(resp => {
						return resp.data.items;
					});
				}
			}
		});
		modalInstance.result.then(resp => {
			this.ThreadService.newThreadsInMyMessage(resp).then(data => {
				_.each(data.data.items, (item) => {
					let index = _.findIndex(this.threads.items, (owner) => {
						return owner._id.toString()===item._id.toString();
					});
					if (index !== -1) {
						this.threads.items[index].lastMessage = item.lastMessage;
						this.threads.items[index].threadUpdatedAt = item.threadUpdatedAt;
					} else {
						this.threads.items.push(item);
						this.threads.totalItem +=1;
					}
				});
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		});
	}
}

angular.module('healthStarsApp').controller('MyMessagesCtrl', MyMessagesCtrl);