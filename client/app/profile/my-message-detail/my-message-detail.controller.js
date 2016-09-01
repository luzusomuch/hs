'use strict';

class MyMessageDetailCtrl {
	constructor($localStorage, $state, ThreadService, thread, $uibModal, growl) {
		this.growl = growl;
		this.$uibModal = $uibModal;
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.thread = thread;
		this.thread.nonReceiveEmailUsers = (this.thread.nonReceiveEmailUsers) ? this.thread.nonReceiveEmailUsers : [];
	}

	textAreaAdjust() {
		let element = angular.element('textarea#reply-textarea');
		let scrollHeight = element[0].scrollHeight;
		element[0].style.height = scrollHeight + 'px';
	}

	sendMessage(message) {
		if (this.thread.blocked) {
			this.growl.error(`<p>{{'THIS_THREAD_HAS_BLOCKED' | translate}}</p>`);
			return false;
		}
		if (message && message.trim().length > 0) {
			this.ThreadService.sendMessage(this.thread._id, {message: message}).then(resp => {
				resp.data.sentUserId = this.authUser;
				this.thread.messages.push(resp.data);
				this.message = null;
				angular.element('textarea#reply-textarea')[0].style.height = 35+'px';
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

	receiveEmail() {
		this.ThreadService.configReceiveEmail(this.thread._id).then(resp => {
			this.thread.nonReceiveEmailUsers = resp.data.nonReceiveEmailUsers;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	block() {
		this.ThreadService.block(this.thread._id).then(resp => {
			this.thread.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
			}).catch(() => {
				this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
			});
		});
	}
}

angular.module('healthStarsApp').controller('MyMessageDetailCtrl', MyMessageDetailCtrl);