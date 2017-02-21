'use strict';

class ReportCtrl {
  constructor($uibModalInstance, ReportService, $localStorage, id, type, growl) {
    this.growl = growl;
  	this.$uibModalInstance = $uibModalInstance;
  	this.ReportService = ReportService;
  	this.report = {};
  	this.authUser = $localStorage.authUser;
  	this.id = id;
  	this.type = type;
  	this.submitted = false;
    this.placeholderText;

    let placeHoldersTranslate = [{
      value: 'REPORT_EVENT', text: ($localStorage.language==='en') ? 'Please describe why this Event is not appropriated' : 'Bitte beschreib möglichst genau, warum dieses Event gegen unsere Ricktlinien verstößt...'
    }, {
      value: 'REPORT_USER', text: ($localStorage.language==='en') ? 'Please describe why this User is not appropriated' : 'Bitte beschreib möglichst genau, warum dieses User gegen unsere Ricktlinien verstößt...'
    }, {
      value: 'REPORT_PHOTO', text: ($localStorage.language==='en') ? 'Please describe why this Photo is not appropriated' : 'Bitte beschreib möglichst genau, warum dieses Foto gegen unsere Ricktlinien verstößt...'
    }, {
      value: 'REPORT_COMMENT', text: ($localStorage.language==='en') ? 'Please describe why this Comment is not appropriated' : 'Bitte beschreib möglichst genau, warum dieses Kommentare gegen unsere Ricktlinien verstößt...'
    }]

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

    let index = _.findIndex(placeHoldersTranslate, item => {
      return item.value===this.modalName;
    });
    if (index !== -1) {
      this.placeholderText = placeHoldersTranslate[index].text;
    }
  }

  submit(form) {
  	if (form.$valid) {
  		this.report.reportedItemId = this.id;
  		this.report.type = this.type;
  		this.ReportService.create(this.report).then(() => {
        this.$uibModalInstance.close();
  			this.growl.success(`<p>{{'THANK_YOU_FOR_YOUR_REPORT' | translate}}</p>`);
  		}).catch(() => {
  			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
  		});
  	} else {
  		this.growl.error(`<p>{{'PLEASE_CHECK_YOUR_INPUT' | translate}}</p>`);
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
					templateUrl: 'app/report/report.html',
					controller: 'ReportCtrl',
					controllerAs: 'vm',
					resolve: {
						id: () => {
							return scope.id;
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
	};
}).controller('ReportCtrl', ReportCtrl);