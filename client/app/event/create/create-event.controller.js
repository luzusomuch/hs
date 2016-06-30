'use strict';

class CreateEventCtrl {
	constructor($http, $scope, $uibModal, EventService, RelationService, $localStorage) {
		this.user = $localStorage.authUser;
		this.event = {
			repeat: {},
			participants: []
		};
    this.$http = $http;
    this.RelationService = RelationService;
    this.$uibModal = $uibModal;
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
    			this.event.repeat[data.type] = {
    				repeating: true,
    				startDate: data.startDate,
    				endDate: data.endDate
    			};
    		}, err => {
    			console.log(err);
    		});
    	}
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
    			return this.RelationService.getAll({id: this.user._id, type: 'friend'});
    		},
    		participants: () => {
    			return this.event.participants;
    		}
    	}
    });
		modalInstance.result.then(data => {
			this.event.participants = _.union(this.event.participants, data);
		}, err => {
			console.log(err);
		});
  }

  create(form) {
  	console.log(form);
  	console.log(this.event);

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