'use strict';
import async from 'async';
import _ from 'lodash';
import moment from 'moment';

// type is hours or minutes 
function getHourOrMinute(type, dateTime) {
  if (type==='hours') {
    return moment(dateTime).hours();
  } else {
    return moment(dateTime).minutes();
  }
}
module.exports = (kernel, cb) => {
  let dateFormat = 'YYYY-MM-DD';
  let hourFormat = 'HH:mm';
  let fullDateFormat = 'YYYY-MM-DD HH:mm';
  let todayFormated = moment().format(dateFormat);
  // kernel.model.Event.find({
  //   blocked: false,
  //   $or: [{'repeat.type': 'daily'}, {'repeat.type': 'weekly'}, {'repeat.type': 'monthly'}]
  // }).then(events => {
  //   console.log('total repeated event');
  //   console.log(events.length);
  //   async.each(events, (event, callback) => {
  //     // check when current date is after the end of event 
  //     // then allow to create new instance of repeat event
  //     if (moment(moment()).isAfter(moment(event.endDateTime))) {
  //       let newStartDateTime, newEndDateTime;
  //       let eventTotalDays = moment(moment(event.endDateTime).format(dateFormat)).diff(moment(event.startDateTime).format(dateFormat), 'days');
  //       let eventRepeat = {
  //         startDate: event.repeat.startDate,
  //         endDate: event.repeat.endDate
  //       };
  //       switch (event.repeat.type) {
  //         case 'daily': 
  //           if (moment(todayFormated).isSameOrAfter(moment(eventRepeat.startDate).format(dateFormat)) && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
  //             newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
  //             newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
  //           }
  //           break;
  //         case 'weekly': 
  //           let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
  //           if (diffDay!==0 && diffDay % 7 === 0 && moment(todayFormated).isBefore(moment(eventRepeat.endDate).format(dateFormat))) {
  //             newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
              
  //             newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
  //           }
  //           break;
  //         case 'monthly': 
  //           if (moment(todayFormated).isSameOrAfter(moment(eventRepeat.startDate).format(dateFormat)) && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
  //             let totalDaysInMonth = moment().daysInMonth();
  //             let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
  //             if (diffDay!==0 && diffDay % totalDaysInMonth === 0 && moment(todayFormated).isBefore(moment(eventRepeat.endDate).format(dateFormat))) {
  //               newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
                
  //               newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
  //             }
  //           }
  //           break;
  //         default:
  //           break;
  //       }
  //       async.parallel([
  //         (cb) => {
  //           if (moment(todayFormated).isAfter(moment(eventRepeat.endDate).format(dateFormat))) {
  //             event.repeat.type = 'none';
  //             event.save().then(() => {
  //               cb();
  //             }).catch(err => {
  //               cb(err);
  //             });
  //           } else {
  //             cb();
  //           }
  //         },
  //         (cb) => {
  //           if (newStartDateTime && newEndDateTime) {
  //             let newEvent = {
  //               startDateTime: newStartDateTime,
  //               endDateTime: newEndDateTime,
  //               ownerId: event.ownerId,
  //               name: event.name,
  //               description: event.description,
  //               categoryId: event.categoryId,
  //               tags: event.tags,
  //               awardId: event.awardId,
  //               participantsId: [],
  //               photosId: event.photosId,
  //               public: event.public,
  //               location: event.location,
  //               private: event.private,
  //               banner: event.banner,
  //               createdFromRepeatEvent: true,
  //               parentId: event._id,
  //               stats: {
  //                 totalParticipants: 0
  //               }
  //             };
  //             kernel.model.Event(newEvent).save().then(saved => {
  //               console.log('new event created');
  //               var url = kernel.config.baseUrl + 'event/'+saved._id;
  //               async.each(saved.participantsId, (id, callback) => {
  //                 kernel.model.User.findById(id).then(user => {
  //                   if (!user) {return callback();}
  //                   kernel.emit('SEND_MAIL', {
  //                     template: 'event-created.html',
  //                     subject: 'New Event Created Named ' + event.name,
  //                     data: {
  //                       user: user, 
  //                       url: url,
  //                       event: event
  //                     },
  //                     to: user.email
  //                   });
  //                   callback();
  //                 }).catch(err => {
  //                   callback(err);
  //                 });
  //               }, () => {
  //                 async.waterfall([
  //                   (_cb) => {
  //                     // get all user who like this event
  //                     kernel.model.Like.find({objectName: 'Event', objectId: event._id}).distinct('ownerId').then(likedUsers => {
  //                       _cb(null, likedUsers);
  //                     }).catch(_cb);
  //                   },
  //                   (result, _cb) => {
  //                     // join event participants and user whose liked this event
  //                     let userIds = _.union(result, event.participantsId);
  //                     // get uniq userIds
  //                     userIds = _.map(_.groupBy(userIds, (doc) => {
  //                       return doc;
  //                     }), (grouped) => {
  //                       return grouped[0];
  //                     });
  //                     // if event owner liked his event then remove his' _id from userIds list
  //                     let index = _.findIndex(userIds, (id) => {
  //                       return id.toString()===event.ownerId.toString();
  //                     });
  //                     if (index !== -1) {
  //                       userIds.splice(index, 1);
  //                     }
  //                     _cb(null, userIds);
  //                   }
  //                 ], (err, result) => {
  //                   if (err) {
  //                     return cb(err);
  //                   }
  //                   console.log('send email to participantsId and liked user');
  //                   console.log(result);
  //                   async.each(result, (userId, _callback) => {
  //                     // Create new event invitation
  //                     let invite = new kernel.model.InvitationRequest({
  //                       fromUserId: saved.ownerId,
  //                       toUserId: userId,
  //                       objectId: saved._id
  //                     });
  //                     invite.save(_callback);
  //                   }, () => {
  //                     console.log('invitation sent');
  //                     kernel.queue.create('TOTAL_EVENT_CREATED', {userId: saved.ownerId}).save();
  //                     // kernel.queue.create('GRANTAWARD', saved).save();
  //                     kernel.ES.create({type: kernel.ES.config.mapping.eventType, id: saved._id.toString(), data: saved}, cb);
  //                   });
  //                 });
  //               });
  //             }).catch(err => {
  //               cb(err);
  //             });
  //           } else {
  //             cb();
  //           }
  //         }
  //       ], () => {
  //         callback();
  //       });
  //     } else {
  //       callback();
  //     }
  //   }, () => {
  //     console.log("Done create repeat event");
  //     cb();
  //   });
  // }).catch(err => {
  //   console.log("Error when create repeat event");
  //   cb(err);
  // });

  let createRepeatEvent = (id, _callback) => {
    kernel.model.Event.findById(id).then(event => {
      if (!event) {
        _callback();
      } else {
        let newStartDateTime, newEndDateTime;
        let eventTotalDays = moment(moment(event.endDateTime).format(dateFormat)).diff(moment(event.startDateTime).format(dateFormat), 'days');
        let eventRepeat = {
          startDate: event.repeat.startDate,
          endDate: event.repeat.endDate
        };
        switch (event.repeat.type) {
          case 'daily': 
            if (moment(moment()).isSameOrAfter(moment(eventRepeat.startDate)) && moment(moment()).isSameOrBefore(moment(eventRepeat.endDate))) {
              newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
              newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
            }
            break;
          case 'weekly': 
            let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
            if (diffDay!==0 && diffDay % 7 === 0 && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
              newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
              newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
            }
            break;
          case 'monthly': 
            if (moment(todayFormated).isSameOrAfter(moment(eventRepeat.startDate).format(dateFormat)) && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
              let totalDaysInMonth = moment().daysInMonth();
              let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
              if (diffDay!==0 && diffDay % totalDaysInMonth === 0 && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
                newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
                newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
              }
            }
            break;
          default:
            break;
        }
        
        async.parallel([
          (cb) => {
            if (moment(todayFormated).isAfter(moment(eventRepeat.endDate).format(dateFormat))) {
              event.repeat.type = 'none';
              event.save().then(() => {
                cb();
              }).catch(err => {
                cb(err);
              });
            } else {
              cb();
            }
          },
          (cb) => {
            if (newStartDateTime && newEndDateTime) {
              let newEvent = {
                startDateTime: newStartDateTime,
                endDateTime: newEndDateTime,
                ownerId: event.ownerId,
                name: event.name,
                description: event.description,
                categoryId: event.categoryId,
                tags: event.tags,
                awardId: event.awardId,
                participantsId: [],
                photosId: event.photosId,
                public: event.public,
                location: event.location,
                private: event.private,
                banner: event.banner,
                createdFromRepeatEvent: true,
                parentId: event._id,
                
                limitNumberOfParticipate: event.limitNumberOfParticipate,
                numberParticipants: event.numberParticipants,
                waitingParticipantIds: [],

                costOfEvent: event.costOfEvent,
                amount: event.amount,
                currency: event.currency,

                stats: {
                  totalParticipants: 0
                }
              };
              // check out if new event that existed or not
              kernel.model.Event.find({
                ownerId: newEvent.ownerId, 
                parentId: newEvent.parentId, 
                name: newEvent.name,
                categoryId: newEvent.categoryId,
                awardId: newEvent.awardId
              }).then(existeds => {
                let allowCreate = false;
                if (existeds && existeds.length > 0) {
                  let index = _.findIndex(existeds, (item) => {
                    return moment(moment(item.startDateTime).format(fullDateFormat)).isSame(moment(newEvent.startDateTime).format(fullDateFormat)) && moment(moment(item.endDateTime).format(fullDateFormat)).isSame(moment(newEvent.endDateTime).format(fullDateFormat)) 
                  });
                  
                  if (index === -1) {
                    allowCreate = true;
                  }
                } else {
                  allowCreate = true;
                }

                console.log(allowCreate);
                // cb();
                
                if (allowCreate) {
                  console.log('create new event');
                  kernel.model.Event(newEvent).save().then(saved => {
                    console.log('new event created');
                    var url = kernel.config.baseUrl + 'event/'+saved._id;
                    async.each(saved.participantsId, (id, callback) => {
                      if (event.usersDeclineRepeatingEvent && event.usersDeclineRepeatingEvent.length > 0 && _.findIndex(event.usersDeclineRepeatingEvent, userId => {
                        return userId.toString()===id.toString();
                      }) === -1) {
                        kernel.model.User.findById(id).then(user => {
                          if (!user) {return callback();}
                          kernel.emit('SEND_MAIL', {
                            template: 'event-created.html',
                            subject: 'New Event Created Named ' + event.name,
                            data: {
                              user: user, 
                              url: url,
                              event: event
                            },
                            to: user.email
                          });
                          callback();
                        }).catch(err => {
                          callback(err);
                        });
                      } else {
                        callback();
                      }
                    }, () => {
                      async.waterfall([
                        (_cb) => {
                          // get all user who like this event
                          kernel.model.Like.find({objectName: 'Event', objectId: event._id}).distinct('ownerId').then(likedUsers => {
                            _cb(null, likedUsers);
                          }).catch(_cb);
                        },
                        (result, _cb) => {
                          // join event participants and user whose liked this event
                          let userIds = _.union(result, event.participantsId);

                          // add owner of event to receive invitation for repeating instance
                          userIds.push(event.ownerId);

                          // get uniq userIds
                          userIds = _.map(_.groupBy(userIds, (doc) => {
                            return doc;
                          }), (grouped) => {
                            return grouped[0];
                          });

                          // if event owner liked his event then remove his' _id from userIds list
                          // let index = _.findIndex(userIds, (id) => {
                          //   return id.toString()===event.ownerId.toString();
                          // });
                          // if (index !== -1) {
                          //   userIds.splice(index, 1);
                          // }
                          _cb(null, userIds);
                        }
                      ], (err, result) => {
                        if (err) {
                          return cb(err);
                        }
                        console.log('send email to participantsId and liked user');
                        async.each(result, (userId, _callback) => {
                          if (event.usersDeclineRepeatingEvent && event.usersDeclineRepeatingEvent && _.findIndex(event.usersDeclineRepeatingEvent, id => {
                            return id.toString()===userId.toString();
                          }) === -1) {
                            // create notification
                            kernel.queue.create('CREATE_NOTIFICATION', {
                              ownerId: userId,
                              toUserId: userId,
                              fromUserId: saved.ownerId,
                              type: 'event-invitation',
                              element: saved
                            }).save();

                            // Create new event invitation
                            console.log('create invitation');
                            let invite = new kernel.model.InvitationRequest({
                              fromUserId: saved.ownerId,
                              toUserId: userId,
                              objectId: saved._id
                            });
                            invite.save(_callback);
                          } else {
                            _callback();
                          }
                        }, () => {
                          console.log('invitation sent');
                          kernel.queue.create('TOTAL_EVENT_CREATED', {userId: saved.ownerId}).save();
                          // kernel.queue.create('GRANTAWARD', saved).save();
                          kernel.ES.create({type: kernel.ES.config.mapping.eventType, id: saved._id.toString(), data: saved}, cb);
                        });
                      });
                    });
                  }).catch(err => {
                    cb(err);
                  });
                } else {
                  console.log('event was existed');
                  cb();
                }
              }).catch(cb);
            } else {
              cb();
            }
          }
        ], _callback);
      }
    }).catch(_callback);
  };

  // insert the unique event id to events id array
  let getUniqueEventsId = (array, id, callback) => {
    let index = _.findIndex(array, (item) => {
      return item.toString()===id.toString();
    });

    if (index === -1) {
      array.push(id);
    }
    callback();
  };

  // new flow
  kernel.model.Event.find({blocked: false}).then(events => {
    let uniqueEventsId = [];
    async.each(events, (event, callback) => {
      // again we filter out event that end date time is greator than today to make sure it was end
      if (moment(moment().format(fullDateFormat)).isSameOrAfter(moment(event.endDateTime).format(fullDateFormat))) {
        // if event was already a repeat instance
        if (event.parentId && event.createdFromRepeatEvent) {
          getUniqueEventsId(uniqueEventsId, event.parentId, callback);
        } else {
          if (event.repeat && ['daily', 'weekly', 'monthly'].indexOf(event.repeat.type) !== -1) {
            // check if the parent event has child or not
            kernel.model.Event.find({parentId: event._id}).then(resp => {
              if (resp.length===0) {
                getUniqueEventsId(uniqueEventsId, event._id, callback);
              } else {
                callback();
              }
            }).catch(callback);
          } else {
            callback();
          }
        }
      } else {
        callback();
      }
    }, () => {
      async.each(uniqueEventsId, (id, callback) => {
        createRepeatEvent(id, callback);
      }, () => {
        console.log('done create repeat event');
        cb();
      });
    });
  }).catch(err => {
    console.log('error when create repeat event');
    cb(err);
  });
};