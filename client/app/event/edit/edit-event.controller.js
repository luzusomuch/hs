'use strict';

class EditEventCtrl {
	constructor(PhotoViewer, event, categories, APP_CONFIG, Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $localStorage, $cookies, growl, awards) {
    // check if user leave this state
    $scope.$on('$stateChangeStart', () => {
      if (this.removedPhotoIds.length > 0) {
        this.removePhotoInServer(this.removedPhotoIds);
      }
    });
    this.isEditingEvent = false;
    // removed photo ids use when user remove photo and then update event
    this.removedPhotoIds = [];

    this.isUploading = false;

    this.PhotoViewer = PhotoViewer;
    this.awards = awards.data.items;
    this.growl = growl;
		this.user = $localStorage.authUser;

    let availableUserIds = [event.ownerId._id];
    if (event.adminId && event.adminId._id) {
      availableUserIds.push(event.adminId._id);
    }
		if (availableUserIds.indexOf(this.user._id)===-1) {
			$state.go('home');
		}
    
    this.categories = categories;
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
          types: ['country'],
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

    this.imageStyle = {};

    $scope.$on('$destroy', function() {
      //do anything such as remove socket
    });

    $scope.$watch('vm.event.endTime', (nv) => {
      if (nv) {
        this.event.endTimeFormatted = moment(nv).format('HH:mm');
      }
    });

    $scope.$watch('vm.event.startTime', (nv) => {
      if (nv) {
        this.event.startTimeFormatted = moment(nv).format('HH:mm');
        // check if user select start time more than 11pm then add new date for end date
        let endTimeOfADay = moment('23:00', 'HH:mm');
        if (moment(moment(nv)).isSameOrAfter(endTimeOfADay) && moment(moment(this.event.startDate).format('YYYY-MM-DD')).isSame(moment(this.event.endDate).format('YYYY-MM-DD'))) {
          this.event.endDate = new Date(moment(this.event.endDate).add(1, 'days'));
        }
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

    // find out currency based on selected country 
    $scope.$watch('vm.address.selected', (nv) => {
      this.currencies = [];
      if (nv && nv.address_components && nv.address_components.length > 0) {
        _.each(nv.address_components, (item) => {
          if (item.types[0]==='country') {
            $http.get('/api/v1/countries/currency', {params: {countryCode: item.short_name}}).then(resp => {
              this.currencies = resp.data.currencies;
            });
          }
        });
      }
    });

    this.friends = [];
    this.RelationService.getAll({id: this.user._id, type: 'friend'}).then(resp => {
    	this.friends = resp.data.items;
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

  repeatEvent(isRepeat) {
    if (isRepeat) {
      let modalInstance = this.$uibModal.open({
        animation: true,
        templateUrl: 'app/event/modal/repeat-event.html',
        controller: 'RepeatEventCtrl',
        controllerAs: 'vm',
        resolve: {
          type: () => {
            return (this.event.repeat) ? this.event.repeat.type : null;
          },
          startDate: () => {
            return this.event.startDate;
          },
          endDate: () => {
            return (this.event.repeat) ? this.event.repeat.endDate : null;
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
			this.event.participants = _.union(this.event.participants, data);
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
  	// $files.forEach(file => {
   //    //check file
   //    file.photoType = type;
   //    let index = _.findIndex(this.files, (f) => {
   //      return f.name === file.name && f.size === file.size;
   //    });

   //    if (index === -1) {
   //    	// find out the current banner index and remove it from files array
   //    	let idx = _.findIndex(this.files, (file) => {
   //    		if (type==='banner') {
   //    			return file.photoType === 'banner';
   //    		}
   //    	});
   //    	if (idx !== -1) {
   //    		this.files.splice(idx, 1);
   //    	}

   //      this.$uibModal.open({
   //      animation: true,
   //      templateUrl: 'app/profile/modal/crop-image/view.html',
   //      controller: 'CropImageCtrl',
   //      controllerAs: 'CropImage',
   //      resolve: {
   //        file: () => {
   //          return [file];
   //        },
   //        cropType: () => {
   //          return 'rectangle';
   //        },
   //        imageSize: () => {
   //          return {width: $files[0].$ngfWidth};
   //        }
   //      }
   //    }).result.then(resp => {
   //      // this.files.push(file);
   //      resp.photoType = 'banner';
   //      this.files.push(resp);

   //      this.newBanner = [resp];
   //    });
   //    }
   //  });
    // this.newBanner = _.filter(this.files, {photoType: 'banner'});
    // this.event.bannerName = (this.newBanner.length > 0) ? this.newBanner[0].name : null;
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
            return {width: $files[0].$ngfWidth, height: $files[0].$ngfHeight};
          },
          isBanner: () => {
            return true;
          }
        }
      }).result.then(resp => {
        this.bannerPreviewWidth = $('.banner-preview').width();
        this.imageStyle = {};
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
          // this.files.push(uploadedPhoto.data);
          this.event.photosId.push(uploadedPhoto.data);
        }, () => {
          this.isUploading = false;
          this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
        });
      });
    }
  }

  removePhotoInServer(id) {
    let ids = [];
    if (id instanceof Array) {
      ids = id;
    } else {
      ids = [id];
    }
    this.PhotoViewer.deleteList({filesId: ids});
  }

  removePhoto(photo, type) {
    if (type==='photo') {
      let index = _.findIndex(this.event.photosId, (p) => {
        return p._id === photo._id;
      });
      if (index !== -1) {
        this.removedPhotoIds.push(photo._id);
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
        this.growl.error(`<p>{{'AVAILABLE_CURRENCIES' | translate}} ${this.currencies.toString()}</p>`)
      }
    }

    if (this.event.limitNumberOfParticipate && this.event.participants.length > this.event.numberParticipants) {
      this.errors.limitNumberOfParticipate = true;
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

      this.event.photos = _.map(this.event.photosId, (photo) => {
        return photo._id;
      });
      this.event.photosLength = this.event.photos.length;
      this.isEditingEvent = true;
  		this.Upload.upload({
	      url: '/api/v1/events/'+this.$state.params.id,
	      method: 'PUT',
	      arrayKey: '',
	      data: {file: this.newBanner, event: this.event},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(() => {
        this.submitted = false;
	    	this.$state.go('event.detail', {id: this.$state.params.id});
        this.isEditingEvent = false;
	    }, () => {
	    	this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
        this.isEditingEvent = false;
	    });
  	} else {
      this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
    }
  }
}

angular.module('healthStarsApp')
	.controller('EditEventCtrl', EditEventCtrl);
