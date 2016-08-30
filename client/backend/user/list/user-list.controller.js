'use strict';

class BackendUsersListCtrl {
	constructor($scope, User, $uibModal) {
		this.User = User;
		this.$uibModal = $uibModal;
		this.users = {
			page: 1
		};
		this.sortType = 'createdAt';
		this.sortReverse = false;

		this.showBlockedUsers = false;

		this.getUsers();

		this.search = {
			search: false
		};

		// Search query
		$scope.$watchGroup(['vm.showBlockedUsers', 'vm.searchText'], (nv) => {
			if (nv[0] && nv[1] && nv[1].trim().length > 0) {
				this.search.search = true;
				this.searchFn({blocked: true, searchText: nv[1]});
			} else if (nv[0]) {
				this.search.search = true;
				this.searchFn({blocked: true});
			} else if (nv[1] && nv[1].trim().length > 0) {
				this.search.search = true;
				this.searchFn({searchText: nv[1]});
			} else {
				this.search.search = false;
			}
		});
	}

	getUsers() {
		this.User.list({page: this.users.page}).then(resp => {
			this.users.items = (this.users.items) ? this.users.items.concat(resp.data.items) : resp.data.items;
			this.users.totalItem = resp.data.totalItem;
			this.users.page += 1;
		});
	}

	searchFn(params) {
		this.User.list(params).then(resp => {
			this.search.items = resp.data.items;
		});
	}

	blockUser(user) {
		this.User.blockUser(user._id).then(resp => {
			user.blocked = resp.data.blocked;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});
	}

	editUserInfo(user) {
		this.$uibModal.open({
			animation: true,
			templateUrl: 'backend/user/edit/view.html',
			controller: 'BackendEditUserCtrl',
			controllerAs: 'EditUser',
			resolve: {
				user: () => {
					return user;
				}
			}
		}).result.then(data => {
			if (!data.location.fullAddress) {
				data.location.coordinates = [0, 0];
			}
			this.User.updateProfile(data._id, data).then(() => {
				// TODO show message
	      	}).catch(err => {
	      		console.log(err);
	      		// TODO show error
	      	});
		}, err => {
			// TODO show erro
			console.log(err);
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendUsersListCtrl', BackendUsersListCtrl);
