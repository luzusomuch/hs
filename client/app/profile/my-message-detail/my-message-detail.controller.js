'use strict';

class MyMessageDetailCtrl {
	constructor($localStorage, $state, ThreadService, thread) {
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.ThreadService = ThreadService;
		this.thread = thread;
		console.log(thread);
	}

	textAreaAdjust() {
		let element = angular.element('textarea#reply-textarea');
		let scrollHeight = element[0].scrollHeight;
		element[0].style.height = scrollHeight + "px";
	}

	sendMessage(message) {
		if (message && message.trim().length > 0) {
			this.ThreadService.sendMessage(this.thread._id, {message: message}).then(resp => {
				resp.data.sentUserId = this.authUser;
				this.thread.messages.push(resp.data);
				this.message = null;
				angular.element('textarea#reply-textarea')[0].style.height = 31+"px";
			}).catch(err => {
				// TODO show error
				console.log(err);
			});
		} else {
			// TODO show error
		}
	}
}

angular.module('healthStarsApp').controller('MyMessageDetailCtrl', MyMessageDetailCtrl);