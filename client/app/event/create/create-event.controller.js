'use strict';

class CreateEventCtrl {
	constructor(Upload, $http, $state, $scope, $uibModal, EventService, RelationService, AwardService, CategoryService, $localStorage, $cookies) {
		this.Upload = Upload;
		this.$cookies = $cookies;
		this.files = [];
		this.user = $localStorage.authUser;
		this.event = {
			repeat: {},
			participants: [],
			location: {}
		};
    this.$http = $http;
    this.$state = $state;
    this.EventService = EventService;
    this.RelationService = RelationService;
    this.AwardService = AwardService;
    this.$uibModal = $uibModal;
    this.address = {};
    this.addresses = [];

    $scope.$on('$destroy', function() {
      //do anything such as remove socket
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
    		});
    	}
    });

    this.friends = [];
    this.RelationService.getAll({id: this.user._id, type: 'friend'}).then(resp => {
    	this.friends = resp.data.items;
    });

    this.categories = [];
    CategoryService.getAll().then(resp => {
    	this.categories = resp.data.items;
    });
  }

  refreshAddresses(address) {
    var params = {address: address, sensor: false};
    return this.$http.get(
      'http://maps.googleapis.com/maps/api/geocode/json',
      {params: params}
    ).then( (response) => {
      this.addresses = response.data.results;
    });
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

  select($files) {
  	$files.forEach(file => {
      //check file
      let index = _.findIndex(this.files, (f) => {
        return f.name === file.name && f.size === file.size;
      });

      if (index === -1) {
        this.files.push(file);
      }
    });
  }

  create(form) {
  	if (form.$valid && this.address.selected) {
  		var selectedAddress = this.address.selected;
      this.event.location.coordinates = [selectedAddress.geometry.location.lng, selectedAddress.geometry.location.lat];
      this.event.location.country = selectedAddress.address_components[selectedAddress.address_components.length -1].long_name;
      this.event.location.countryCode = selectedAddress.address_components[selectedAddress.address_components.length -1].short_name;
      this.event.location.fullAddress = selectedAddress.formatted_address;

  		this.event.startDateTime = new Date(moment(this.event.startDate).hours(moment(this.event.startTime).hours()).minutes(moment(this.event.startTime).minutes()));
  		this.event.endDateTime = new Date(moment(this.event.endDate).hours(moment(this.event.endTime).hours()).minutes(moment(this.event.endTime).minutes()));

  		this.Upload.upload({
	      url: '/api/v1/events',
	      arrayKey: '',
	      data: {file: this.files, event: this.event},
	      headers: {'Authorization': `Bearer ${this.$cookies.get('token')}`}
	    }).then(resp =>{
	    	this.$state.go('event.detail', {id: resp._id});
	    }, (err) => {
	    	console.log(err);
	    });
      // this.EventService.create(this.event).then(resp => {
      // 	this.$state.go('event.detail', {id: resp._id});
      // }).catch(err => {
      // 	console.log(err);
      // });
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
	}

	submit(form) {
		if (form.$valid && this.repeat.type) {
			if (moment(moment(this.repeat.endDate).format('YYYY-MM-DD')).isSameOrAfter(moment(this.repeat.startDate).format('YYYY-MM-DD'))) {
				this.$uibModalInstance.close(this.repeat);
			} else {
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