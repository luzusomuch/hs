'use strict';

class CreateEventCtrl {
	constructor(APP_CONFIG, Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $localStorage, $cookies) {
		this.APP_CONFIG = APP_CONFIG;
    this.Upload = Upload;
		this.$cookies = $cookies;
		this.files = [];
    this.newBanner = [];
		this.user = $localStorage.authUser;
		this.event = {
			repeat: {},
			participants: [],
			location: {},
      public: true,
      isRepeat: false,
      startDate: new Date(), 
      allowShow: false
		};
    this.shareEventInfo = {};
    this.$http = $http;
    this.$state = $state;
    this.EventService = EventService;
    this.RelationService = RelationService;
    this.AwardService = AwardService;
    this.$uibModal = $uibModal;
    this.address = {};
    this.addresses = [];
    this.submitted = false;
    this.errors = {};
    this.selectedCategory = {};

    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });

    $scope.$watch('vm.event.startDate', (nv) => {
      // set end date is same as start date
      if (nv) {
        this.event.endDate = nv;
      }
    });

    $scope.$watch('vm.event.isRepeat', (nv) => {
    	if (nv) {
    		let modalInstance = $uibModal.open({
		    	animation: true,
		    	templateUrl: 'app/event/modal/repeat-event.html',
		    	controller: 'RepeatEventCtrl',
		    	controllerAs: 'vm'
		    });
    		modalInstance.result.then(data => {
    			this.event.repeat = {
    				type: data.type,
    				startDate: data.startDate,
    				endDate: data.endDate
    			};
    		}, err => {
    			console.log(err);
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
    this.RelationService.getAll({id: this.user._id, type: 'friend'}).then(resp => {
    	this.friends = resp.data.items;
    });

    this.categories = [];
    CategoryService.getAll().then(resp => {
    	this.categories = resp.data.items;
      this.event.categoryId = this.categories[0]._id;
    });

    this.options = {
      minDate: new Date(),
      showWeeks: true
    };

    this.checkValidTime = (time) => {
      if (time) {
        let splittedTime = time.split(':');
        let validFormat = time.indexOf(':') > -1 && splittedTime.length > 0 && (splittedTime[0] >= 0 && splittedTime[0] < 24) && (splittedTime[1] >= 0 && splittedTime[1] < 60);
        if (validFormat) {
          let newTime = new Date(moment().hours(splittedTime[0]).minutes(splittedTime[1]));
          return {valid: true, time: newTime};
        } else {
          return {valid: false};
        }
      } else {
        return {valid: false};
      }
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
    	templateUrl: 'app/event/modal/add-participants.html',
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
		}, err => {
			console.log(err);
		});
  }

  removeParticipant(index) {
  	this.event.participants.splice(index, 1);
  }

  showAddAwardModal() {
  	let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'app/event/modal/add-award.html',
    	controller: 'AddAwardCtrl',
    	controllerAs: 'vm',
    	resolve: {
    		awards: () => {
    			return this.AwardService.getAll();
    		},
    		selectedAward: () => {
    			return this.event.award;
    		}
    	}
    });
		modalInstance.result.then(data => {
			this.event.award = data;
		}, err => {
			console.log(err);
		});
  }

  select($files, type) {
    if (type==='banner') {
      this.newBanner = $files;
      this.event.bannerName = (this.newBanner.length > 0) ? this.newBanner[0].name : null;
    } else {
    	$files.forEach(file => {
        file.photoType = type;
        //check file
        let index = _.findIndex(this.files, (f) => {
          return f.name === file.name && f.size === file.size;
        });

        if (index === -1) {
          this.files.push(file);
        }
      });
    }
  }

  create(form) {
    this.errors = {};
    this.submitted = true;
    if (this.checkValidTime(this.event.startTimeFormatted).valid) {
      this.event.startTime = this.checkValidTime(this.event.startTimeFormatted).time;
    } else {
      this.errors.startDateTime = true;
    }

    if (this.checkValidTime(this.event.endTimeFormatted).valid) {
      this.event.endTime = this.checkValidTime(this.event.endTimeFormatted).time;
    } else {
      this.errors.endDateTime = true;
    }

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
        return this.errors.dateTime = true;
      }

      this.files = _.union(this.files, this.newBanner);

  		this.Upload.upload({
	      url: '/api/v1/events',
	      arrayKey: '',
	      data: {file: this.files, event: this.event},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
        this.event.url = `${this.APP_CONFIG.baseUrl}event/detail/${resp.data._id}`;
	    	this.$state.go('event.detail', {id: resp.data._id});
        this.submitted = false;
        this.event.allowShow = true;
	    }, (err) => {
	    	console.log(err);
        // TODO show error
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
				this.growl.error('Check your repeating start date and end date');
			}
		} else {
			this.growl.error('Check your input');
		}
	}
}

angular.module('healthStarsApp')
	.controller('CreateEventCtrl', CreateEventCtrl)
	.controller('RepeatEventCtrl', RepeatEventCtrl);