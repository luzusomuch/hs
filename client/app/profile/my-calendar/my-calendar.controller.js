'use strict';

class MyCalendarCtrl {
	constructor($scope, $state, $localStorage, EventService, $timeout, APP_CONFIG, uiCalendarConfig) {
		this.errors = {};
		this.authUser = $localStorage.authUser;
		this.$state = $state;
		this.EventService = EventService;
		this.uiCalendarConfig = uiCalendarConfig;
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
		        eventRender: (event, element) => {
		        	let photoUrl = 'assets/images/img.jpg';
		        	if (event.photo) {
	        			photoUrl = (event.photo.metadata.small) ? event.photo.metadata.small : 'assets/photos/'+event.photo.metadata.tmp;
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

      	$timeout(() => {
      		gapi.load('auth2', () => {
				this.auth2 = gapi.auth2.init({
					client_id: APP_CONFIG.apiKey.ggAppId,
					fetch_basic_profile: true,
					scope: 'https://www.googleapis.com/auth/calendar.readonly'
				});
			});
      	}, 1000);

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
			if (type==='local') {
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
					type: 'local',
					photo: (event.photosId && event.photosId.length > 0) ? event.photosId[0] : null,
					backgroundColor: backgroundColor
				});
			} else if (type==='google') {
				items.push({
					title: event.summary,
					start: new Date(event.start.date),
					end: new Date(event.end.date),
					id: event.id,
					type: 'google',
					url: event.htmlLink
				});
			} else if (type==='facebook') {
				items.push({
					title: event.name,
					start: new Date(event.start_time),
					end: new Date(event.end_time),
					id: event.id,
					type: 'facebook',
					url: 'https://www.facebook.com/events/'+event.id+'/'
				});
			}
		});
		if (type==='local') {
			this.eventSources.push(items);
		} else if (type==='google' || type==='facebook') {
			let calendar = angular.element('#calendar');
			// calendar.fullCalendar('removeEvents');
			calendar.fullCalendar('addEventSource', items);
		}
	}

	syncGoogleCalendar() {
		this.auth2.signIn().then(resp => {
			gapi.load('client', () => {
				gapi.client.load('calendar', 'v3', () => {
					gapi.client.calendar.events.list({
			          	'calendarId': 'primary',
			          	'showDeleted': false,
			        }).execute(resp => {
			        	this.renderEvents(resp.items, 'google');
			        });
				});
			});
		});
	}

	syncFacebookCalendar() {
		FB.getLoginStatus(resp => {
			if (resp.authResponse) {
				FB.api('/me/events', (data) => {
					if (data.data && data.data.length > 0) {
						this.renderEvents(data.data, 'facebook');
					}
				});
			} else {
				FB.login();
			}
		});
	}
}

angular.module('healthStarsApp').controller('MyCalendarCtrl', MyCalendarCtrl);