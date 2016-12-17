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

      		if ((event.liked && event.participants.indexOf(this.authUser._id) === -1) || event.repeatEvent) {
      			$(element).css('opacity', 0.6);
      		}
        },
        eventClick: (event) => {
        	if (event.type==='local') {
        		$state.go('event.detail', {id: event.id});
        	} else {
        		window.open(event.link, '_blank');
        	}
        }
    	}
		};

  	this.loadEvents();
	}

	loadEvents(type) {
		let dateFormat = 'YYYY-MM-DD';
		// let todayFormated = moment().format(dateFormat);
		this.EventService.getUserEvent({getAll: true, pageSize: 100}).then(resp => {
			this.localEvents = resp.data;
			if (this.localEvents.items && this.localEvents.items.length > 0) {
				_.each(this.localEvents.items, (event) => {
					// check if user has decline all repeating instance or not
					if (!event.createdFromRepeatEvent && !event.parentId && event.usersDeclineRepeatingEvent && _.findIndex(event.usersDeclineRepeatingEvent, id => {
						return id.toString()===this.authUser._id.toString();
					}) === -1) {
						// find out repeating event and now is after event end date
						if (event.repeat && event.repeat.type && event.repeat.type!=='none' && moment(moment()).isAfter(moment(event.endDateTime))) {
							let newStartDateTime, newEndDateTime;
			      	let eventTotalDays = moment(moment(event.endDateTime).format(dateFormat)).diff(moment(event.startDateTime).format(dateFormat), 'days');
			      	let eventRepeat = {
		        		startDate: event.repeat.startDate,
			        	endDate: event.repeat.endDate
			      	};
			      	let totalRepeatedDays = moment(moment(eventRepeat.endDate).format(dateFormat)).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');

							switch (event.repeat.type) {
				        case 'daily': 
			            	for (var i = 0; i < totalRepeatedDays; i++) {
			            		let newStartDateTime = new Date(moment().add(i, 'days'));
			            		let newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days'));

			            		let newEvent = {
			            			name: event.name,
			            			startDateTime: newStartDateTime,
			            			endDateTime: newEndDateTime,
			            			ownerId: event.ownerId,
			            			categoryId: event.categoryId,
			            			_id: event._id,
			            			type: 'local',
			            			photosId: event.photosId,
			            			repeatEvent: true
			            		};
			            		let index = _.findIndex(this.localEvents.items, (item) => {
			            			return item.name===newEvent.name && moment(moment(newEvent.startDateTime).format(dateFormat)).isSame(moment(item.startDateTime).format(dateFormat)) && moment(moment(newEvent.endDateTime).format(dateFormat)).isSame(moment(item.endDateTime).format(dateFormat));
			            		});

			            		if (index === -1) {
			            			this.localEvents.items.push(newEvent);
			            		}
			            	}
				          	break;
				        case 'weekly': 
				        	for (var i = 0; i < totalRepeatedDays; i++) {
				        		if (i%7 === 0 && i !== 0) {
				        			newStartDateTime = new Date(moment().add(i, 'days'));
			            		newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days'));

			            		let newEvent = {
			            			name: event.name,
			            			startDateTime: newStartDateTime,
			            			endDateTime: newEndDateTime,
			            			ownerId: event.ownerId,
			            			categoryId: event.categoryId,
			            			_id: event._id,
			            			type: 'local',
			            			photosId: event.photosId,
			            			repeatEvent: true
			            		};

			            		let index = _.findIndex(this.localEvents.items, (item) => {
			            			return item.name===newEvent.name && moment(moment(newEvent.startDateTime).format(dateFormat)).isSame(moment(item.startDateTime).format(dateFormat)) && moment(moment(newEvent.endDateTime).format(dateFormat)).isSame(moment(item.endDateTime).format(dateFormat));
			            		});

			            		if (index === -1) {
			            			this.localEvents.items.push(newEvent);
			            		}
				        		}
				        	}
			          	break;
				        case 'monthly': 
				        	for (var i = 0; i < totalRepeatedDays; i++) {
				        		let tmpDate = moment().add(i, 'days').format(dateFormat);
				        		let diffDay = moment(tmpDate).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
				        		let totalDaysInMonth = moment(tmpDate).daysInMonth();
				        		if (diffDay !== 0 && diffDay % totalDaysInMonth === 0) {
				        			newStartDateTime = new Date(moment().add(i, 'days'));
			            		newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days'));

			            		let newEvent = {
			            			name: event.name,
			            			startDateTime: newStartDateTime,
			            			endDateTime: newEndDateTime,
			            			ownerId: event.ownerId,
			            			categoryId: event.categoryId,
			            			_id: event._id,
			            			type: 'local',
			            			photosId: event.photosId,
			            			repeatEvent: true
			            		};

			            		let index = _.findIndex(this.localEvents.items, (item) => {
			            			return item.name===newEvent.name && moment(moment(newEvent.startDateTime).format(dateFormat)).isSame(moment(item.startDateTime).format(dateFormat)) && moment(moment(newEvent.endDateTime).format(dateFormat)).isSame(moment(item.endDateTime).format(dateFormat));
			            		});

			            		if (index === -1) {
			            			this.localEvents.items.push(newEvent);
			            		}
				        		}
				        	}
			          	break;
				        default:
			          	break;
			      	}
						}
					}
				});
			}
			this.renderEvents(this.localEvents.items, type);
		});
	}

	renderEvents(events, type) {
		let items = [];
		_.each(events, (event) => {
			let backgroundColor, link;
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
			if (event.type==='google') {
				link = event.google.htmlLink;
			} else if (event.type==='facebook') {
				link = 'https://www.facebook.com/events/'+event.facebook.id;
			}

			let participants = [];
			if (event.participantsId && event.participantsId instanceof Array) {
				participants = angular.copy(event.participantsId);
			}
			participants.push(event.ownerId);

			// find out parent of repeated event
			let repeatEvent;
			if (event.repeatEvent || event.createdFromRepeatEvent) {
				repeatEvent = true;
			}

			let index = _.findIndex(events, (e) => {
				if (event.parentId) {
					return event.parentId.toString()===e._id.toString();
				}
			});
			if (index!==-1) {
				repeatEvent = false;
			}

			items.push({
				title: event.name,
				start: new Date(event.startDateTime),
				end: new Date(event.endDateTime),
				id: event._id,
				type: (event.type) ? event.type : 'local',
				photo: (event.photosId && event.photosId.length > 0) ? event.photosId[0] : null,
				backgroundColor: backgroundColor, 
				link: link,
				liked: event.liked,
				participants: participants,
				repeatEvent: repeatEvent
			});
		});
		
		// filter created items array again to find out parent event
		_.each(items, (item) => {
			let index = _.findIndex(events, (event) => {
				if (event.parentId) {
					return event.parentId.toString()===item.id.toString();
				}
			});
			if (index !== -1 && !item.repeatEvent) {
				item.participants = _.union(item.participants, events[index].participantsId);
			}
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
							this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
							this.growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
						});
					}
				});
			}
		}, {scope: 'user_events'});
	}
}

angular.module('healthStarsApp').controller('MyCalendarCtrl', MyCalendarCtrl);