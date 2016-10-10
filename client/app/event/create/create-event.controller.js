'use strict';

class CreateEventCtrl {
	constructor(APP_CONFIG, Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $localStorage, $cookies, growl, awards) {
		this.APP_CONFIG = APP_CONFIG;
    this.growl = growl;
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
      allowShow: false,
      startTime: new Date(),
      endTime: moment().add(1, 'hours'),
      limitNumberOfParticipate: false
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
    this.awards = awards.data.items;

    this.newDate = new Date();
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
		    	controllerAs: 'vm',
          resolve: {
            startDate: () => {
              return this.event.startDate;
            },
            endDate: () => {
              return null;
            },
            type: () => {
              return null;
            }
          }
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
        this.event.endTime = moment(nv).add(1, 'hours');
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
          if (this.selectedCategory && this.awards && this.awards.length > 0 && !this.showAddAwards()) {
            let selectedAwardName;
            switch (this.selectedCategory.type) {
              case 'food':
                selectedAwardName = 'Foodstar Point';
                break;
              case 'action':
                selectedAwardName = 'Actionstar Point';
                break;
              case 'eco':
                selectedAwardName = 'Ecostar Point';
                break;
              case 'social':
                selectedAwardName = 'Socialstar Point';
                break;
              case 'internation':
                selectedAwardName = 'Sportstar Point';
                break;
              default:
                break;
            }
            if (selectedAwardName) {
              let index = _.findIndex(this.awards, (award) => {
                return award.objectName===selectedAwardName;
              });
              if (index !== -1) {
                this.event.award = this.awards[index];
              }
            }
          }
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
      _.each(this.categories, (cat) => {
        switch (cat.type) {
          case 'food': 
            cat.menuName = 'foodstar';
            cat.order = 2;
            break;
          case 'action':
            cat.menuName = 'actionstar';
            cat.order = 5;
            break;
          case 'eco':
            cat.menuName = 'ecostar';
            cat.order = 4;
            break;
          case 'social': 
            cat.menuName = 'socialstar';
            cat.order = 3; 
            break;
          case 'internation':
            cat.menuName = 'sportstar';
            cat.order = 1;
            break;
          default:
            cat.menuName = cat.type;
            cat.order = this.categories.length;
            break;
        }
      });
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
    };
  }

  showAddAwards() {
    let result = false;
    if (this.user.role==='admin') {
      result = true;
    } else if (this.user.isCompanyAccount) {
      result = true;
    }
    return result;
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
    			return this.AwardService.getAvailableAwards();
    		},
    		selectedAward: () => {
    			return this.event.award;
    		}
    	}
    });
		modalInstance.result.then(data => {
      this.AwardService.get(data._id).then(resp => {
			 this.event.award = resp.data;
      });
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
        this.errors.dateTime = true;
        return false;
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
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
	    });
  	} else {
      this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
    }
  }
}

class RepeatEventCtrl {
	constructor($uibModalInstance, growl, startDate, endDate, type) {
		this.$uibModalInstance = $uibModalInstance;
		this.growl = growl;
		this.repeat = {
      startDate: (startDate) ? new Date(startDate) : new Date(),
			endDate: (endDate) ? new Date(endDate) : new Date(moment().add(1, 'days')),
      type: type
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

angular.module('healthStarsApp')
	.controller('CreateEventCtrl', CreateEventCtrl)
	.controller('RepeatEventCtrl', RepeatEventCtrl);