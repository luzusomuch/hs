'use strict';

class MyCalendarCtrl {
	constructor($scope, $state, $localStorage, EventService) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.EventService = EventService;

		this.localEvents = {};

      	this.eventSources = [];

		this.calendarConfig = {
	        height: 450,
	        header:{
          		left: 'prev,next',
          		center: 'title',
          		right: 'agendaWeek month'
	        },
	        eventClick: (event) => {
	        	if (event.type==='local') {
	        		$state.go('event.detail', {id: event.id});
	        	}
	        },
      	};

      	this.loadEvents();
	}

	loadEvents() {
		this.EventService.getUserEvent({getAll: true}).then(resp => {
			this.localEvents = resp.data;
			this.renderEvents(this.localEvents.items, 'local');
		}).catch(err => {
			// TODO show error
			console.log(err);
		});
	}

	renderEvents(events, type) {
		let items = [];
		_.each(events, (event) => {
			items.push({
				title: event.name,
				start: new Date(event.startDateTime),
				end: new Date(event.endDateTime),
				id: event._id,
				type: 'local'
			})
		});
		this.eventSources.push(items);
	}
}

angular.module('healthStarsApp').controller('MyCalendarCtrl', MyCalendarCtrl);