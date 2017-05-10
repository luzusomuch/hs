'use strict';

class CreateEventCtrl {
	constructor(PhotoViewer, APP_CONFIG, Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $localStorage, $cookies, growl, awards) {
    // check if user leave this state
    $scope.$on('$stateChangeStart', () => {
      if (this.files.length > 0) {
        PhotoViewer.deleteList({filesId: _.map(this.files, '_id')});
      }
    });
    this.PhotoViewer = PhotoViewer;
    this.isCreatingEvent = false;
		this.APP_CONFIG = APP_CONFIG;
    this.growl = growl;
    this.Upload = Upload;
		this.$cookies = $cookies;
		this.files = [];
    this.isUploading = false;
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
      limitNumberOfParticipate: false,
      costOfEvent: false,
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
    this.imageStyle = {};
    this.defaultPicture = [];
    this.defaultBanner = [];
    this.selectedDefaultBannerId;
    this.selectedDefaultPictureId = 'default';

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
        // check if user select start time more than 11pm then add new date for end date
        let endTimeOfADay = moment('23:00', 'HH:mm');
        if (moment(moment(nv)).isSameOrAfter(endTimeOfADay) && moment(moment(this.event.startDate)).isSame(moment(this.event.endDate))) {
          this.event.endDate = new Date(moment(this.event.endDate).add(1, 'days'));
        }
      }
    });

    $scope.$watch('vm.event.categoryId', (nv) => {
      if (nv) {
        let idx = _.findIndex(this.categories, (cat) => {
          return cat._id===nv;
        });
        if (idx !== -1) {
          this.selectedCategory = this.categories[idx];
          if (this.selectedCategory && this.awards && this.awards.length > 0) {
            let selectedAwardName, starName;
            switch (this.selectedCategory.type) {
              case 'food':
                selectedAwardName = 'Foodstar Point';
                starName = 'Food';
                break;
              case 'action':
                selectedAwardName = 'Actionstar Point';
                starName = 'Action';
                break;
              case 'eco':
                selectedAwardName = 'Ecostar Point';
                starName = 'Eco';
                break;
              case 'social':
                selectedAwardName = 'Socialstar Point';
                starName = 'Social';
                break;
              case 'internation':
                selectedAwardName = 'Sportstar Point';
                starName = 'Sport';
                break;
              default:
                break;
            }
            // find default banner/picture
            this.findEventPictureOrBanner('banner', starName);
            this.findEventPictureOrBanner('picture', starName);

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

    // find out currency based on selected country 
    $scope.$watch('vm.address.selected', (nv) => {
      this.currencies = [];
      if (nv && nv.address_components && nv.address_components.length > 0) {
        _.each(nv.address_components, (item) => {
          if (item.types[0]==='country') {
            $http.get('/api/v1/countries/currency', {params: {countryCode: item.short_name}}).then(resp => {
              this.currencies = resp.data.currencies;
              if (this.currencies.length > 0) {
                this.event.currency = this.currencies[0];
              }
            });
          }
        });
      }
    });
  }

  // find event picture/ banner base on selected star
  findEventPictureOrBanner(type, star) {
    // type is picture/banner
    // star is sport/action/eco/food/social
    let photoType = star + ' ' + type;
    this.PhotoViewer.getPhotosEvent({type: photoType}).then(resp => {
      if (type==='banner') {
        this.defaultBanner = resp.data.items;
        if (this.defaultBanner.length > 0) {
          this.selectedDefaultBannerId = this.defaultBanner[0]._id;
        }
      } else {
        this.defaultPicture = resp.data.items;
      }
    });
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
        'https://maps.googleapis.com/maps/api/geocode/json',
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
    if (type==='banner' && $files[0]) {
      this.$uibModal.open({
        animation: true,
        templateUrl: 'app/profile/modal/crop-image/view.html',
        controller: 'CropImageCtrl',
        controllerAs: 'CropImage',
        resolve: {
          file: () => {
            return $files;
          },
          cropType: () => {
            return 'rectangle';
          },
          imageSize: () => {
            let height = ($files[0].$ngfHeight > 300) ? $files[0].$ngfHeight : 300; 
            let width = height * 3;
            return {width: width, height: height};
          },
          isBanner: () => {
            return true;
          }
        }
      }).result.then(resp => {
        this.imageStyle = {};
        this.bannerPreviewWidth = $('.banner-preview').width();
        this.newBanner = [resp];
        if (this.newBanner[0].coords.w >= this.bannerPreviewWidth) {
          this.imageStyle = {'width': '100%'};
        }
        this.event.bannerName = (this.newBanner.length > 0) ? this.newBanner[0].name : null;
      });
    } else if (type==='photo' && $files[0]) {
      this.$uibModal.open({
        animation: true,
        templateUrl: 'app/profile/modal/crop-image/view.html',
        controller: 'CropImageCtrl',
        controllerAs: 'CropImage',
        resolve: {
          file: () => {
            return $files;
          },
          cropType: () => {
            return 'rectangle';
          },
          imageSize: () => {
            return {width: $files[0].$ngfWidth/2, height: $files[0].$ngfHeight/2};
          },
          isBanner: () => {
            return false;
          }
        }
      }).result.then(resp => {
        this.isUploading = true;
        this.Upload.upload({
          url: '/api/v1/photos',
          data: {file: resp},
          headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
        }).then(uploadedPhoto =>{
          this.isUploading = false;
          this.files.push(uploadedPhoto.data);
        }, () => {
          this.isUploading = false;
          this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
        });
      });
    }
  }

  create(form) {
    if (this.isUploading) {
      return this.growl.error(`<p>{{'PLEASE_WATI_UNTIL_UPLOAD_DONE' | translate}}</p>`);
    }
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
    if (this.event.costOfEvent) {
      if (this.currencies && this.currencies.length > 0 && this.event.currency && this.currencies.indexOf(this.event.currency)===-1) {
        this.errors.currency = true;
        this.growl.error(`<p>{{'AVAILABLE_CURRENCIES' | translate}} ${this.currencies.toString()}</p>`);
      }
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

      // this.files = _.union(this.files, this.newBanner);
      // get uploaded event photos
      this.event.uploadedPhotoIds = _.map(this.files, '_id');
      this.event.defaultBannerId = this.selectedDefaultBannerId;
      this.event.defaultPictureId = this.selectedDefaultPictureId;

      this.isCreatingEvent = true;

      // make a check for selected default picture
      if (this.event.uploadedPhotoIds.length > 0) {
        delete this.event.defaultBannerId;
      }
      if (this.newBanner && this.newBanner.length > 0) {
        delete this.event.defaultBannerId;
      }

  		this.Upload.upload({
	      url: '/api/v1/events',
	      arrayKey: '',
	      data: {file: this.newBanner, event: this.event},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
        this.submitted = false;
        this.files = [];
        this.event = resp.data;
        this.event.url = `${this.APP_CONFIG.baseUrl}event/detail/${resp.data._id}`;
        this.event.allowShow = true;
        this.isCreatingEvent = false;
        this.$state.go('event.detail', {id: resp.data._id});
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
        this.isCreatingEvent = false;
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