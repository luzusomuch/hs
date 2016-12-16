'use strict';

class SetAdminRoleCtrl {
	constructor(users, $uibModalInstance, EventService, $rootScope, eventId, growl) {
		this.$uibModalInstance = $uibModalInstance;
		this.EventService = EventService;
		this.users = users;
		this.eventId = eventId;
		this.growl = growl;

		$rootScope.$watch('onlineUsers', (nv) => {
			if (nv && nv.length > 0) {
				_.each(this.users, (user) => {
					let index = _.findIndex(nv, (onlineId) => {
						return onlineId.toString()===user._id.toString();
					});
					if (index !== -1) {
						user.online = true
					}
				});
			}
		}, true);
	}

	setAdmin(user) {
		this.EventService.passAdminRole(this.eventId, {adminId: user._id}).then(() => {
			this.$uibModalInstance.close(user);
		}).catch(() => {
			return this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);		
		});
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('SetAdminRoleCtrl', SetAdminRoleCtrl);