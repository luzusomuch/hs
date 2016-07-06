'use strict';

class EventDetailCtrl {
	constructor($scope, event, $localStorage, liked, LikeService) {
		this.event = event;
		this.liked = liked;
		this.authUser = $localStorage.authUser;

		this.LikeService = LikeService;
	}

	isNotParticipant() {
		if(!this.event.participantsId) {
			return true;
		}
		return this.event.participantsId.indexOf(this.authUser._id) === -1;
	}

	like() {
		this.LikeService.likeOrDislike(this.event._id, 'Event').then(resp => {
			this.liked = resp.data.liked;
			if (this.liked) {
				this.event.totalLike = (this.event.totalLike) ? this.event.totalLike + 1 : 1;
			} else {
				this.event.totalLike = this.event.totalLike -1;
			}
		}).catch(err => {
			console.log(err);
		});
	}

}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);