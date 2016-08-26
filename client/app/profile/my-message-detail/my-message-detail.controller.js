'use strict';

class MyMessageDetailCtrl {
	constructor($localStorage, $state, ThreadService, thread) {
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
		let index = this.thread.nonReceiveEmailUsers.indexOf(this.authUser._id);
		if (index !== -1) {
			this.thread.nonReceiveEmailUsers.splice(index ,1);
		} else {
			this.thread.nonReceiveEmailUsers.push(this.authUser._id);
		}
	}

	block() {
		this.ThreadService.block(this.thread._id).then(resp => {
			this.thread.blocked = resp.data.blocked;
		}).catch(err => {
			// TODO show error
			console.log(err);
		})
	}
}

angular.module('healthStarsApp').controller('MyMessageDetailCtrl', MyMessageDetailCtrl);