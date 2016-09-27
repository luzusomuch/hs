'use strict';

class BackendEventEditCtrl {
	constructor(growl, event, categories, APP_CONFIG, Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $cookies) {
		this.growl = growl;
    this.categories = categories;
    // Init event
		this.event = event;
		this.event.categoryId = event.categoryId._id;
		this.event.startDate = new Date(event.startDateTime);
		this.event.endDate = new Date(event.endDateTime);
		this.event.startTime = new Date(moment().hours(moment(event.startDateTime).hours()).minutes(moment(event.startDateTime).minutes()));
		this.event.endTime = new Date(moment().hours(moment(event.endDateTime).hours()).minutes(moment(event.endDateTime).minutes()));
		this.event.isRepeat = (event.repeat && event.repeat.type) ? true : false;
    this.address = {};
    if (this.event.location.fullAddress) {
  		this.address.selected = {
				formatted_address: event.location.fullAddress,
				formatted_short_address: event.location.fullAddress.substr(0, 35) + ' ...',
				geometry: {
					location: {
						lng: event.location.coordinates[0],
						lat: event.location.coordinates[1]
					}
				},
				address_components: [{
					long_name: event.location.country,
					short_name: event.location.countryCode
				}]
			};
    }
		this.event.award = event.awardId;
		this.event.participants = event.participantsId;
		// End init event
		this.APP_CONFIG = APP_CONFIG;
    this.Upload = Upload;
		this.$cookies = $cookies;
		this.files = [];
    this.$http = $http;
    this.$state = $state;
    this.EventService = EventService;
    this.RelationService = RelationService;
    this.AwardService = AwardService;
    this.$uibModal = $uibModal;
    this.addresses = [];
    this.submitted = false;
    this.errors = {};

    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });

    $scope.$watch('vm.event.isRepeat', (nv) => {
    	if (nv) {
    		let modalInstance = $uibModal.open({
		    	animation: true,
		    	templateUrl: 'backend/event/edit/repeat-event.html',
		    	controller: 'RepeatEventCtrl',
		    	controllerAs: 'vm'
		    });
    		modalInstance.result.then(data => {
    			this.event.repeat = {
    				type: data.type,
    				startDate: data.startDate,
    				endDate: data.endDate
    			};
    		}, () => {
    			this.event.isRepeat = false;
    		});
    	}
    });

    $scope.$watch('vm.event.endTime', (nv) => {
      if (nv) {
        this.event.endTimeFormatted = moment(nv).format('HH:mm');
      }
    });

    $scope.$watch('vm.event.startTime', (nv) => {
      if (nv) {
        this.event.startTimeFormatted = moment(nv).format('HH:mm');
      }
    });

    this.selectedCategory = {};
    $scope.$watch('vm.event.categoryId', (nv) => {
      if (nv) {
        let idx = _.findIndex(this.categories, (cat) => {
          return cat._id===nv;
        });
        if (idx !== -1) {
          this.selectedCategory = this.categories[idx];
        }
      }
    });

    this.friends = [];
    this.RelationService.getAll({id: this.event.ownerId._id, type: 'friend'}).then(resp => {
    	this.friends = resp.data.items;
    });

    this.options = {
      minDate: new Date(),
      showWeeks: true
    };
  }

  changeStartTime(time) {
    if (time) {
      this.event.endTime = moment(time).add(1, 'hours');
    }
  }

  refreshAddresses(address) {
    if (address.trim().length > 0) {
      var params = {address: address, sensor: false};
      return this.$http.get(
        'http://maps.googleapis.com/maps/api/geocode/json',
        {params: params}
      ).then( (response) => {
        _.each(response.data.results, (result) => {
          result.formatted_short_address = result.formatted_address.substr(0, 35) + ' ...';
        });
        this.addresses = response.data.results;
      });
    }
  }

  showAddParticipantsModal() {
  	let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/event/edit/add-participants.html',
    	controller: 'AddParticipantsCtrl',
    	controllerAs: 'vm',
    	resolve: {
    		friends: () => {
    			return this.friends;
    		},
    		participants: () => {
    			return this.event.participants;
    		}
    	}
    });
		modalInstance.result.then(data => {
			this.event.participants = data;
		});
  }

  removeParticipant(index) {
  	this.event.participants.splice(index, 1);
  }

  showAddAwardModal() {
  	let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/event/edit/add-award.html',
    	controller: 'AddAwardCtrl',
    	controllerAs: 'vm',
    	resolve: {
    		awards: () => {
    			return this.AwardService.getAvailableAwards();
    		},
    		selectedAward: () => {
    			return this.event.award;
    		}
    	}
    });
		modalInstance.result.then(data => {
			this.event.award = data;
		});
  }

  select($files, type) {
  	$files.forEach(file => {
      //check file
      file.photoType = type;
      let index = _.findIndex(this.files, (f) => {
        return f.name === file.name && f.size === file.size;
      });

      if (index === -1) {
      	// find out the current banner index and remove it from files array
      	let idx = _.findIndex(this.files, (file) => {
      		if (type==='banner') {
      			return file.photoType === 'banner';
      		}
      	});
      	if (idx !== -1) {
      		this.files.splice(idx, 1);
      	}
        this.files.push(file);
      }
    });
    this.newBanner = _.filter(this.files, {photoType: 'banner'});
    this.event.bannerName = (this.newBanner.length > 0) ? this.newBanner[0].name : null;
  }

  removePhoto(photo, type) {
    if (type==='photo') {
      let index = _.findIndex(this.event.photosId, (p) => {
        return p._id === photo._id;
      });
      if (index !== -1) {
        this.event.photosId.splice(index, 1);
      }
    } else if (type==='file') {
      let index = _.findIndex(this.files, (file) => {
        if (type !== 'banner') {
          return file.name===photo.name;
        }
      });
      if (index !== -1) {
        this.files.splice(index, 1);
      }
    }
  }

  edit(form) {
    this.errors = {};
    this.submitted = true;
    if (!this.event.categoryId) {
      this.errors.category = true;
    }
    if (!this.event.startDate || !this.event.startTime) {
      this.errors.startDateTime = true;
    }
    if (!this.event.endDate || !this.event.endTime) {
      this.errors.endDateTime = true;
    }
    if (!this.address.selected && this.selectedCategory.type!=='action') {
      this.errors.location = true;
    }
    if (!this.event.award) {
      this.errors.award = true;
    }

		var selectedAddress = this.address.selected;
    if (selectedAddress) {
      this.event.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
      this.event.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
      this.event.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
      this.event.location.fullAddress = selectedAddress.formatted_address;
    } else {
      this.event.location.coordinates = [0, 0];
    }
    if (form.$valid && Object.keys(this.errors).length === 0) {

  		this.event.startDateTime = new Date(moment(this.event.startDate).hours(moment(this.event.startTime).hours()).minutes(moment(this.event.startTime).minutes()));
  		this.event.endDateTime = new Date(moment(this.event.endDate).hours(moment(this.event.endTime).hours()).minutes(moment(this.event.endTime).minutes()));

      if (moment(moment(this.event.startDateTime).format('YYYY-MM-DD HH:mm')).isSameOrAfter(moment(this.event.endDateTime).format('YYYY-MM-DD HH:mm'))) {
        this.errors.dateTime = true;
        return;
      }

      this.event.photos = _.map(this.event.photosId, (photo) => {
        return photo._id;
      });
      this.event.photosLength = this.event.photos.length;

  		this.Upload.upload({
	      url: '/api/v1/events/'+this.$state.params.id,
	      method: 'PUT',
	      arrayKey: '',
	      data: {file: this.files, event: this.event},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then( () => {
        this.submitted = false;
	    	this.$state.go('backend.event.list');
        this.growl.success(`<p>{{'UPDATED_ITEM_SUCCESSFULLY' | translate}}</p>`);
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	    });
  	}
  }
}

class RepeatEventCtrl {
	constructor($uibModalInstance, growl) {
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
		this.repeat = {
			startDate: new Date()
		};
    this.errors = {};
    this.submitted = false;
    this.options = {
      minDate: new Date(),
      showWeeks: true
    };
	}

	submit(form) {
    this.submitted = true;
    this.errors = {};
    if (!this.repeat.type) {
      this.errors.type = true;
    }
		if (form.$valid && this.repeat.type) {
			if (moment(moment(this.repeat.endDate).format('YYYY-MM-DD')).isSameOrAfter(moment(this.repeat.startDate).format('YYYY-MM-DD'))) {
				this.$uibModalInstance.close(this.repeat);
			} else {
        this.errors.date = true;
				this.growl.error(`<p>{{'CHECK_YOUR_STARTDATE_ENDDATE' | translate}}</p>`);
			}
		} else {
      this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}
}

class AddParticipantsCtrl {
	constructor($uibModalInstance, friends, participants) {
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
	}

	submit() {
		let selectedParticipants = _.filter(this.friends, {select: true});
		this.$uibModalInstance.close(selectedParticipants);
	}
}

class AddAwardCtrl {
	constructor($uibModalInstance, growl, awards, selectedAward, $uibModal) {
		this.awards = awards.data.items;
		if (selectedAward) {
			let index = _.findIndex(this.awards, (award) => {
				return award._id===selectedAward._id;
			});
			if (index !== -1) {
				this.awards[index].select = true;
			}
		}
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
		this.$uibModal = $uibModal;
	}

	showAddMoreAwardModal() {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/award/create/create-award.html',
    	controller: 'CreateAwardCtrl',
    	controllerAs: 'vm'
    });
		modalInstance.result.then(data => {
			this.awards.push(data);
		});
	}

	selectAward(award) {
		this.awards.forEach(aw => {
			aw.select = false;
		});
		award.select = true;
	}

	submit() {
		let selectedAward = _.filter(this.awards, {select: true});
		if (selectedAward.length > 0) {
			this.$uibModalInstance.close(selectedAward[0]);
		} else {
			this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
		}
	}

  close() {
    this.$uibModalInstance.dismiss();
  }
}

class CreateAwardCtrl {
  constructor($uibModalInstance, $cookies, Upload, growl) {
    this.types = [
      {value: 'accepted', text: 'Award will be granted to every users accepted an event'}, 
      {value: 'gps', text: 'Award will be granted to every users have gps signal send from Healthstars App'}, 
      {value: 'organizer', text: 'Award will be granted by organizer'}, 
      {value: 'offline', text: 'Award will be granted by Healthstars offline (only for company accounts)'}
    ];
    this.award = {};
    this.file = {};
    this.$uibModalInstance = $uibModalInstance;
    this.$cookies = $cookies;
    this.Upload = Upload;
    this.growl = growl;
  }

  select($file) {
    this.file = $file;
  }

  submit(form) {
    if (form.$valid && this.file.name && this.award.type) {
      this.Upload.upload({
        url: '/api/v1/awards',
        arrayKey: '',
        data: {file: this.file, award: this.award},
        headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
      }).then(resp =>{
        this.$uibModalInstance.close(resp.data);
      }, () => {
        this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
      });
    } else {
      this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
    }
  }
}

angular.module('healthStarsApp')
	.controller('BackendEventEditCtrl', BackendEventEditCtrl)
	.controller('RepeatEventCtrl', RepeatEventCtrl)
	.controller('AddParticipantsCtrl', AddParticipantsCtrl)
  .controller('AddAwardCtrl', AddAwardCtrl)
	.controller('CreateAwardCtrl', CreateAwardCtrl);
