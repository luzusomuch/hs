'use strict';

class MyCalendarCtrl {
	constructor($scope, $state, $localStorage, EventService, APP_CONFIG, growl, $timeout) {
		this.$timeout = $timeout;
		this.growl = growl;
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.EventService = EventService;
		this.localEvents = {};

      	this.eventSources = [];
		this.uiConfig = {
			calendarConfig: {
		        height: 450,
		        header:{
	          		left: 'prev,next',
	          		center: 'title',
	          		right: 'agendaWeek month'
		        },
		        allDayText: ($localStorage.language==='en') ? 'All day' : 'Ganztägig',
		        buttonText: {
		        	month: ($localStorage.language==='en') ? 'Month' : 'Monat',
		        	week: ($localStorage.language==='en') ? 'Week' : 'Woche'
		        },
		        eventRender: (event, element) => {
		        	let photoUrl = 'assets/images/img.jpg';
		        	if (event.photo) {
	        			photoUrl = (event.photo.metadata.small) ? event.photo.metadata.small : 'assets/photos/'+event.photo.metadata.tmp;
		        	} else if (event.type==='google') {
		        		photoUrl = 'assets/images/google-logo.jpg';
		        	} else if (event.type==='facebook') {
		        		photoUrl = 'assets/images/FB-logo.png';
		        	}
	        		$(element).find('span:first').prepend('<img width="30" src='+photoUrl+'>');
		        },
		        eventClick: (event) => {
		        	if (event.type==='local') {
		        		$state.go('event.detail', {id: event.id});
		        	}
		        }
	      	}
		};

      	this.loadEvents();
	}

	loadEvents(type) {
		this.EventService.getUserEvent({getAll: true}).then(resp => {
			this.localEvents = resp.data;
			this.renderEvents(this.localEvents.items, type);
		});
	}

	renderEvents(events, type) {
		let items = [];
		_.each(events, (event) => {
			let backgroundColor;
			if (event.categoryId && event.categoryId.type) {}
			switch (event.categoryId.type) {
				case 'action':
					backgroundColor = '#9c59b8';
					break;
				case 'food':
					backgroundColor = '#e84c3d';
					break;
				case 'eco':
					backgroundColor = '#2fcc71';
					break;
				case 'social':
					backgroundColor = '#f1c40f';
					break;
				case 'internation':
					backgroundColor = '#3598dc';
					break;
				default:
					break;
			}
			items.push({
				title: event.name,
				start: new Date(event.startDateTime),
				end: new Date(event.endDateTime),
				id: event._id,
				type: (event.type) ? event.type : 'local',
				photo: (event.photosId && event.photosId.length > 0) ? event.photosId[0] : null,
				backgroundColor: backgroundColor
			});
			// if (event==='local') {
			// 	let backgroundColor;
			// 	if (event.categoryId && event.categoryId.type) {}
			// 	switch (event.categoryId.type) {
			// 		case 'action':
			// 			backgroundColor = '#9c59b8';
			// 			break;
			// 		case 'food':
			// 			backgroundColor = '#e84c3d';
			// 			break;
			// 		case 'eco':
			// 			backgroundColor = '#2fcc71';
			// 			break;
			// 		case 'social':
			// 			backgroundColor = '#f1c40f';
			// 			break;
			// 		case 'internation':
			// 			backgroundColor = '#3598dc';
			// 			break;
			// 		default:
			// 			break;
			// 	}
			// 	items.push({
			// 		title: event.name,
			// 		start: new Date(event.startDateTime),
			// 		end: new Date(event.endDateTime),
			// 		id: event._id,
			// 		type: (event.type) ? event.type : 'local',
			// 		photo: (event.photosId && event.photosId.length > 0) ? event.photosId[0] : null,
			// 		backgroundColor: backgroundColor
			// 	});
			// } else if (event==='google') {
			// 	items.push({
			// 		title: event.summary,
			// 		start: new Date(event.startDateTime),
			// 		end: new Dateevent.startDateTime),
			// 		id: event.id,
			// 		type: 'google',
			// 		url: event.htmlLink
			// 	});
			// } else if (event==='facebook') {
			// 	items.push({
			// 		title: event.name,
			// 		start: new Date(event.start_time),
			// 		end: new Date(event.end_time),
			// 		id: event.id,
			// 		type: 'facebook',
			// 		url: 'https://www.facebook.com/events/'+event.id+'/'
			// 	});
			// }
		});
		if (type) {
			this.$timeout(() => {
				let calendar = angular.element('#calendar');
				calendar.fullCalendar('removeEvents');
				calendar.fullCalendar('addEventSource', items);
			}, 500);
		} else {
			this.eventSources.push(items);	
		}
		// if (type==='local') {
		// 	this.eventSources.push(items);
		// }
		//  else if (type==='google' || type==='facebook') {
		// 	let calendar = angular.element('#calendar');
		// 	// calendar.fullCalendar('removeEvents');
		// 	calendar.fullCalendar('addEventSource', items);
		// }
	}

	syncGoogleCalendar() {
		window.auth2.signIn().then(() => {
			window.gapi.load('client', () => {
				window.gapi.client.load('calendar', 'v3', () => {
					window.gapi.client.calendar.events.list({
			          	'calendarId': 'primary',
			          	'showDeleted': false,
			        }).execute(resp => {
			        	// this.renderEvents(resp.items, 'google');
			        	this.EventService.syncEvents({events: resp.items, type: 'google'}).then(() => {
			        		this.$timeout(() => {
			        			this.loadEvents('google');
			        		}, 1500);
						}).catch(() => {
							this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`)
						});
			        });
				});
			});
		});
	}

	syncFacebookCalendar() {
		FB.login(resp => {
			if (resp.authResponse) {
				FB.api('/me/events', (data) => {
					if (data.data && data.data.length > 0) {
						// this.renderEvents(data.data, 'facebook');
						this.EventService.syncEvents({events: data.data, type: 'facebook'}).then(() => {
							this.$timeout(() => {
			        			this.loadEvents('facebook');
			        		}, 1500);
						}).catch(() => {
							this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`)
						});
					}
				});
			}
		}, {scope: 'user_events'});
	}
}

angular.module('healthStarsApp').controller('MyCalendarCtrl', MyCalendarCtrl);