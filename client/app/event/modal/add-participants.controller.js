class AddParticipantsCtrl {
	constructor($uibModalInstance, growl, friends, participants) {
		this.friends = friends.data.relations;
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
		if (selectedParticipants.length > 0) {
			this.$uibModalInstance.close(selectedParticipants);
		} else {
			this.growl.error('Select At Least 1 Friend');
		}
	}
}

angular.module('healthStarsApp').controller('AddParticipantsCtrl', AddParticipantsCtrl);