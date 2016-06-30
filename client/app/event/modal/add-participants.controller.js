class AddParticipantsCtrl {
	constructor($uibModalInstance, growl, friends, participants) {
		this.friends = friends;
		this.participants = participants;
		_.each(this.participants, (participant) => {
			let index = _.findIndex(this.friends, (friend) => {
				return friend._id===participant._id;
			});
			if (index !== -1) {
				this.friends[index].select = true;
			}
		});
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
	}

	submit() {
		let selectedParticipants = _.filter(this.friends, {select: true});
		this.$uibModalInstance.close(selectedParticipants);
	}
}

angular.module('healthStarsApp').controller('AddParticipantsCtrl', AddParticipantsCtrl);