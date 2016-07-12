'use strict';

class ReportCtrl {
  constructor($uibModalInstance, ReportService, $localStorage, id, type) {
  	this.$uibModalInstance = $uibModalInstance;
  	this.ReportService = ReportService;
  	this.report = {};
  	this.authUser = $localStorage.authUser;
  	this.id = id;
  	this.type = type;
  	this.submitted = false;

  	switch (this.type) {
  		case 'Event':
  			this.modalName = 'REPORT_EVENT';
  			break;
  		case 'User':
  			this.modalName = 'REPORT_USER';
  			break;
  		case 'Photo':
  			this.modalName = 'REPORT_PHOTO';
  			break;
  		case 'Comment':
  			this.modalName = 'REPORT_COMMENT';
  			break;
  		default: 
  			break;
  	}
  }

  submit(form) {
  	if (form.$valid) {
  		this.report.reportedItemId = this.id;
  		this.report.type = this.type;
  		this.ReportService.create(this.report).then(() => {
  			console.log('success');
  			this.$uibModalInstance.close();
  			// TODO show success message
  		}).catch(err => {
  			console.log(err);
  			// TODO show error
  		});
  	} else {
  		// TODO show validate
  	}
  }
}

angular.module('healthStarsApp').directive('hsReport', ($uibModal) => {
	return {
	  restrict: 'A',
	  scope: {
	  	id: '=',
	    type: '@'
	  },
	  link: function(scope, elm) {
			var func =  function(e){
				e.preventDefault();
				$uibModal.open({
					templateUrl: 'directives/report/report.html',
					controller: 'ReportCtrl',
					controllerAs: 'vm',
					resolve: {
						id: () => {
							return scope.id
						},
						type: () => {
							return scope.type;
						}
					}
				});
			};

			elm.bind('click', func);
			scope.$on('$destroy', function(){
				elm.unbind('click', func);
			});
		}
	}
}).controller('ReportCtrl', ReportCtrl);