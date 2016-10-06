'use strict';

class BackendReportListCtrl {
	constructor($scope, $uibModal, ReportService, growl) {
		this.growl = growl;
		this.page = 1;
		this.reports = {};
		this.searchItems = [];
		this.search = false;
		this.$uibModal = $uibModal;
		this.ReportService = ReportService;
		this.showCheckedReports = false;
		this.filterTypes = [
			{value: 'reporterId.name', text: 'PHOTO_OWNER_NAME'}, 
			{value: 'event.name', text: 'EVENT'}
		];
		this.selectedFilterType = this.filterTypes[0].value;
		this.sortType = 'createdAt';
		this.sortReverse = false;
		this.loadMore();

		$scope.$watchGroup(['vm.showCheckedReports', 'vm.selectedFilterType', 'vm.searchText'], (nv) => {
			if (nv[0] && nv[2] && nv[2].trim().length > 0) {
				this.search = true;
				this.searchReport({checked: true, type: nv[1], searchQuery: nv[2]});
			} else if (nv[0]) {
				this.search = true;
				this.searchReport({checked: true});
			} else if (nv[2] && nv[2].trim().length > 0) {
				this.search = true;
				this.searchReport({type: nv[1], searchQuery: nv[2]});
			} else {
				this.search = false;
			}
		});
	}

	searchReport(params) {
		this.ReportService.search(params).then(resp => {
			this.searchItems = resp.data.items;
		});
	}

	loadMore() {
		this.ReportService.getAll({page: this.page}).then(resp => {
	  		this.page += 1;
	  		this.reports.items = (this.reports.items) ? this.reports.items.concat(resp.data.items) : resp.data.items;
	  		this.reports.totalItem = resp.data.totalItem;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	markAsChecked(report) {
		this.ReportService.markAsChecked(report._id).then(() => {
			report.checked = true;
		}).catch(() => {
			this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
		});
	}

	view(report) {
		this.$uibModal.open({
	    	animation: true,
	    	templateUrl: 'backend/report/detail/view.html',
	    	controller: 'BackendReportDetailCtrl',
	    	resolve: {
	    		report: () => {
	    			return report;
	    		}
	    	}
	    });
	}
}

angular.module('healthStarsApp')
	.controller('BackendReportListCtrl', BackendReportListCtrl);
