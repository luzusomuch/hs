'use strict';

class BackendReportListCtrl {
	constructor($scope, $uibModal, ReportService) {
		this.page = 1;
		this.reports = {};
		this.$uibModal = $uibModal;
		this.ReportService = ReportService;
		this.showCheckedReports = false;
		this.filterTypes = [{value: 'reporterId.name', text: 'Owner'}, {value: 'event.name', text: 'Event'}];
		this.selectedFilterType = this.filterTypes[0].value;
		this.sortType = 'createdAt';
		this.sortReverse = false;
		this.loadMore();

		$scope.$watch('vm.reports.items', (nv) => {
			if (nv && nv.length > 0) {
				let nonCheckedPhotos = _.filter(nv, {checked: false});
				if (nonCheckedPhotos.length <= 5 && nv.length < this.reports.totalItem) {
					this.loadMore();
				}
			}
		});
	}

	loadMore() {
		this.ReportService.getAll({page: this.page}).then(resp => {
  		this.page += 1;
  		this.reports.items = (this.reports.items) ? this.reports.items.concat(resp.data.items) : resp.data.items;
  		this.reports.totalItem = resp.data.totalItem;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	markAsChecked(report) {
		this.ReportService.markAsChecked(report._id).then(resp => {
			report.checked = true;
		}).catch(err => {
			console.log(err);
			// TODO show error
		});
	}

	view(report) {
		let modalInstance = this.$uibModal.open({
    	animation: true,
    	templateUrl: 'backend/report/detail/view.html',
    	controller: 'BackendReportDetailCtrl',
    	resolve: {
    		report: () => {
    			return report;
    		}
    	}
    });
		modalInstance.result.then(() => {
			
		}, err => {
			console.log(err);
			// TODO show error
		});
	}
}

angular.module('healthStarsApp')
	.controller('BackendReportListCtrl', BackendReportListCtrl)
