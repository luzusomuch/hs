'use strict';

class MyMessageDetailCtrl {
	constructor($localStorage, $state, ThreadService, thread, $uibModal) {
		this.$uibModal = $uibModal;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.thread = thread;
		this.thread.nonReceiveEmailUsers = (this.thread.nonReceiveEmailUsers) ? this.thread.nonReceiveEmailUsers : []
	}

	textAreaAdjust() {
		let element = angular.element('textarea#reply-textarea');
		let scrollHeight = element[0].scrollHeight;
		element[0].style.height = scrollHeight + "px";
	}

	sendMessage(message) {
		if (this.thread.blocked) {
			// TODO show error
			return false;
		}
		if (message && message.trim().length > 0) {
			this.ThreadService.sendMessage(this.thread._id, {message: message}).then(resp => {
				resp.data.sentUserId = this.authUser;
				this.thread.messages.push(resp.data);
				this.message = null;
				angular.element('textarea#reply-textarea')[0].style.height = 35+"px";
			}).catch(err => {
				// TODO show error
				console.log(err);
			});
		} else {
			// TODO show error
		}
	}

	receiveEmail() {
		this.ThreadService.configReceiveEmail(this.thread._id).then(resp => {
			//TODO Show success message
			this.thread.nonReceiveEmailUsers = resp.data.nonReceiveEmailUsers;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});
	}

	block() {
		this.ThreadService.block(this.thread._id).then(resp => {
			this.thread.blocked = resp.data.blocked;
		}).catch(err => {
			// TODO show error
			console.log(err);
		});
	}

	addTags() {
		let modalInstance = this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'app/profile/modal/add-tags-to-thread/view.html',
	    	controller: 'AddTagsToThreadCtrl',
	    	controllerAs: 'AddTagsToThread',
	    	resolve: {
	    		tags: () => {
	    			return this.thread.tags;
	    		}
	    	}
	    });
		modalInstance.result.then(data => {
			this.ThreadService.changeTags(this.thread._id, {tags: data}).then(resp => {
				this.thread.tags = resp.data.tags;
			}).catch(err => {
				console.log(err);
				// TODO shw error
			});
		});
	}
}

angular.module('healthStarsApp').controller('MyMessageDetailCtrl', MyMessageDetailCtrl);