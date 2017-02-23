'use strict';

class EventDetailCtrl {
	constructor($scope, $state, event, $localStorage, liked, LikeService, Upload, $cookies, $stateParams, FeedService, PhotoViewer, APP_CONFIG, EventService, growl, $uibModal) {
		this.growl = growl;
		this.$uibModal = $uibModal;
		if (event.blocked) {
			this.growl.error(`<p>{{'THIS_EVENT_HAS_BLOCKED' | translate}}</p>`);
			$state.go('home');
		}
		this.$scope = $scope;

		if (event.repeat && event.repeat.type) {
			event.repeat.type = event.repeat.type.toUpperCase();
		}

		this.event = event;
		// check start and end date is the same or not
		if (moment(moment(this.event.startDateTime).format('YYYY-MM-DD')).isSame(moment(this.event.endDateTime).format('YYYY-MM-DD'))) {
			this.event.isSameDate = true;
		}

		this.event.url = APP_CONFIG.baseUrl + 'event/detail/'+event._id;
		if (this.event.location) {
			this.event.location.lat = this.event.location.coordinates[1];
			this.event.location.lng = this.event.location.coordinates[0];
		}

		this.viewer = PhotoViewer;
		this.submitted = false;
		this.feed = {};
		this.files = [];
		this.errors = {};
		this.liked = liked;
		this.feeds = [];
		this.authUser = $localStorage.authUser;
		this.$localStorage = $localStorage;

		this.LikeService = LikeService;
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.$stateParams = $stateParams;
		this.FeedService = FeedService;
		this.EventService = EventService;

		this.page = 1;
		this.getFeeds({page: this.page});
	}

	loadMoreFeeds() {
		this.FeedService.getAll(this.$stateParams.id, 'event', {page: this.page}).then(resp => {
			this.feeds = this.feeds.concat(resp.data.items);
			this.pageSize = resp.data.totalItem;
			this.page += 1;
		});
	}

	getFeeds(params) {
		this.FeedService.getAll(this.$stateParams.id, 'event', params).then(resp => {
			this.feeds = resp.data.items;
			this.pageSize = resp.data.totalItem;
			this.page += 1;
		});
	}

	viewPhoto(photo, fid) {
		if (!photo.blocked) {
			this.viewer.setPhoto(photo, {
				type: 'feed',
				tid: fid
			});
			this.viewer.toggle(true);
		}
	}

	isInWaitingList() {
		if (!this.event.waitingParticipantIds) {
			return false;
		}
		if (_.findIndex(this.event.waitingParticipantIds, (id) => {
			return id.toString()===this.authUser._id.toString();
		}) !== -1) {
			return true;
		} else {
			return false;
		}
	}

	isNotParticipant() {
		if(!this.event.participantsId) {
			return true;
		}
		let participantsId = angular.copy(this.event.participantsId) || [];
		participantsId.push(this.event.ownerId);
		let idx = _.findIndex(participantsId, (participant) => {
			return participant._id===this.authUser._id;
		});
		if (idx !== -1) {
			return false;
		} else {
			return true;
		}
	}

	like() {
		this.LikeService.likeOrDislike(this.event._id, 'Event').then(resp => {
			this.liked = resp.data.liked;
			if (this.liked) {
				this.event.totalLike = (this.event.totalLike) ? this.event.totalLike + 1 : 1;
			} else {
				this.event.totalLike = this.event.totalLike -1;
			}
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	select($files) {
	  	$files.forEach(file => {
	      	//check file
	      	let index = _.findIndex(this.files, (f) => {
	        	return f.name === file.name && f.size === file.size;
	      	});

	      	if (index === -1) {
		      	this.files.push(file);
		      	this.checkNude(file, (result) => {
		      		file.nude = result;
		      	});
      		}
    	});
  	}

  	checkNude(file, cb) {
	  	setTimeout(function() {
	  		window.nude.load(file.name);
		  	window.nude.scan(result => {
		  		cb(result);
		  	});
	  	}, 500);
  	}

  	removeImage(index) {
  		this.files.splice(index, 1);
  	}

	createNewFeed(feed) {
		this.submitted = true;
		this.errors = {};
		if (_.filter(this.files, {nude: true}).length > 0) {
			this.errors.file = true;
			return false;
		}
		if (feed.content && feed.content.trim().length > 0) {
			feed.eventId = this.$stateParams.id;
			this.Upload.upload({
	      		url: '/api/v1/feeds',
	      		arrayKey: '',
	      		data: {file: this.files, feed: feed},
	      		headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    	}).then(resp =>{
		        this.submitted = false;
		        this.feed = {};
		        this.files = [];
		        this.feeds.push(resp.data);
		        this.event.totalComment = (this.event.totalComment) ? this.event.totalComment+1 : 1;
		    }, () => {
		    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		    });
		} else {
			this.errors.content = true;
		}
	}

	blockPhoto(photo) {
		this.viewer.blockPhoto(photo._id, {type: 'event', eventId: this.$stateParams.id}).then(resp => {
			photo.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	attendEvent() {
		this.EventService.attendEvent(this.event._id).then((resp) => {
			if (resp.data.isParticipant) {
				this.event.participantsId.push(this.authUser);
			} else {
				this.growl.success(`<p>{{'EVENT_REACHED_LIMIT_NUMBER' | translate}}</p>`);
				if (this.event.waitingParticipantIds && this.event.waitingParticipantIds.length > 0) {
					this.event.waitingParticipantIds.push(this.authUser._id);
				} else {
					this.event.waitingParticipantIds = [this.authUser._id];
				}
			}
			this.$scope.$emit('event-update-participants');
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	leaveEvent() {
		if (this.event.adminId && this.event.adminId._id && this.event.adminId._id===this.authUser._id) {
			this.$uibModal.open({
				animation: true, 
				template: `
					<div class="modal-header">
						<h3 class="modal-title" ng-bind-html="'ADMIN_LEAVE_EVENT_CONFIRMATION' | translate | html"></h3>
					</div>
					<div class="modal-body">
					</div>
					<div class="modal-footer">
						<button class="btn btn-primary" ng-click="leaveEvent()" ng-bind-html="'JUST_LEAVE_THIS_EVENT' | translate | html"></button>
						<button class="btn btn-success" ng-click="assignAdminRoleToAnotherUser()" ng-bind-html="'ASSIGN_ADMIN_ROLE_TO_ANOTHER_USER' | translate | html"></button>
						<button class="btn btn-warning" ng-click="cancel()" ng-bind-html="'CANCEL' | translate | html"></button>
					</div>
				`,
				controller: ['$scope', '$uibModalInstance', ($scope, $uibModalInstance) => {
					$scope.leaveEvent = () => {
						$uibModalInstance.close('leave');
					}

					$scope.assignAdminRoleToAnotherUser = () => {
						$uibModalInstance.close('assign');
					}

					$scope.cancel = () => {
						$uibModalInstance.dismiss();
					}
				}],
			}).result.then(resp => {
				if (resp==='leave') {
					this.leaveEventFunction();
				} else if (resp==='assign') {
					this.setAdminRole(true);
				}
			});
		} else {
			this.leaveEventFunction();
		}
	}

	leaveEventFunction() {
		this.EventService.leaveEvent(this.event._id).then(() => {
			let index = _.findIndex(this.event.participantsId, (participant) => {
				return participant._id.toString()===this.authUser._id;
			});
			if (index !== -1) {
				this.event.participantsId.splice(index, 1);
				this.$scope.$emit('event-update-participants');
			}
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	blockFeed(feed) {
		this.FeedService.block(feed._id).then(resp => {
			feed.blocked = resp.data.blocked;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	setAdminRole(leaveEvent) {
		if (this.event.ownerId._id.toString()===this.authUser._id.toString() || (this.event.adminId && this.event.adminId._id && this.event.adminId._id===this.authUser._id)) {
			this.$uibModal.open({
				animation: true,
				templateUrl: 'app/event/modal/set-admin-role/view.html',
				controller: 'SetAdminRoleCtrl',
				controllerAs: 'SetAR',
				resolve: {
					users: ['EventService', (EventService) => {
						return EventService.getAllUsersOfEvent(this.event._id).then(resp => {
							return resp.data.users;
						}).catch(() => {
							return this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);			
						});
					}],
					eventId: () => {
						return this.event._id;
					}
				}
			}).result.then(resp => {
				this.event.adminId = resp;

				if (leaveEvent) {
					this.leaveEventFunction();
				}
			});
		} else {
			return this.growl.error(`<p>{{'NOT_ALLOW' | translate}}</p>`);			
		}
	}

}

angular.module('healthStarsApp').controller('EventDetailCtrl', EventDetailCtrl);