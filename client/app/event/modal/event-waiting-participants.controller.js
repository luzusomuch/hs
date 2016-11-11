class WaitingParticipantsCtrl {
	constructor($uibModalInstance, $state, EventService, $localStorage, onlineUsers, RelationService, growl) {
		this.authUser = $localStorage.authUser;
		this.$uibModalInstance = $uibModalInstance;
		this.$state = $state;
		this.EventService = EventService;
		this.onlineUsers = onlineUsers;
		this.RelationService = RelationService;
		this.growl = growl;

		this.waitingParticipants = {
			pageSize: 20
		};

		this.getWaitingParticipants();

	}

	getWaitingParticipants() {
		this.EventService.getWaitingParticipants(this.$state.params.id, {pageSize: this.waitingParticipants.pageSize}).then(resp => {
			this.waitingParticipants.items = resp.data.items;
			this.waitingParticipants.totalItem = resp.data.totalItem;
			this.waitingParticipants.pageSize += 20;

			// Tracking online/offline user
			_.each(this.waitingParticipants.items, (friend) => {
   			friend.online = false;
   			let index = _.findIndex(this.onlineUsers, (item) => {
   				return item===friend._id;
   			});
   			if (index !== -1) {
   				friend.online = true;
   			}
   		});
		});
	}

	close() {
		this.$uibModalInstance.dismiss();
	}

	addFriend(friend) {
		this.RelationService.create({userId: friend._id, type: 'friend'}).then(resp => {
  		friend.friendStatus = resp.data.type;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}
}

angular.module('healthStarsApp').controller('WaitingParticipantsCtrl', WaitingParticipantsCtrl);