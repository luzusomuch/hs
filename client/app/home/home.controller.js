'use strict';

class HomeCtrl {
	constructor(EventService) {
   this.events = {
   	items: [],
   	totalItem: 0
   };
   this.EventService = EventService;
   this.search();
  }

  search() {
  	this.loading = true;
  	this.EventService.search().then(res => {
  		this.events = res.data;
  		this.loading = false;
  	}, () => this.loading = false);
  }

  pageChange() {
  	this.loading = true;
  	this.EventService.search().then(res => {
  		this.events.items = this.events.items.concat(res.data);
  		this.events.totalItem = res.data.totalItem;
  		this.loading = false;
  	}, () => this.loading = false);
  }
}

angular.module('healthStarsApp').controller('HomeCtrl', HomeCtrl);