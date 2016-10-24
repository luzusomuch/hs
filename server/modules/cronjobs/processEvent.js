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
  let todayFormated = moment().format(dateFormat);
  kernel.model.Event.find({
    blocked: false,
    $or: [{'repeat.type': 'daily'}, {'repeat.type': 'weekly'}, {'repeat.type': 'monthly'}]
  }).then(events => {
    async.each(events, (event, callback) => {
      let newStartDateTime, newEndDateTime;
      let eventTotalDays = moment(moment(event.endDateTime).format(dateFormat)).diff(moment(event.startDateTime).format(dateFormat), 'days');
      let eventRepeat = {
        startDate: event.repeat.startDate,
        endDate: event.repeat.endDate
      };
      switch (event.repeat.type) {
        case 'daily': 
          if (moment(todayFormated).isSameOrAfter(moment(eventRepeat.startDate).format(dateFormat)) && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
            newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
            newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
          }
          break;
        case 'weekly': 
          let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
          if (diffDay!==0 && diffDay % 7 === 0 && moment(todayFormated).isBefore(moment(eventRepeat.endDate).format(dateFormat))) {
            newStartDateTime = new Date(moment().hours(getHourOrMinute('hours', event.startDateTime)).minutes(getHourOrMinute('minutes', event.startDateTime)));
            
            newEndDateTime = new Date(moment(newStartDateTime).add(eventTotalDays, 'days').hours(getHourOrMinute('hours', event.endDateTime)).minutes(getHourOrMinute('minutes', event.endDateTime)));
          }
          break;
        case 'monthly': 
          if (moment(todayFormated).isSameOrAfter(moment(eventRepeat.startDate).format(dateFormat)) && moment(todayFormated).isSameOrBefore(moment(eventRepeat.endDate).format(dateFormat))) {
            let totalDaysInMonth = moment().daysInMonth();
            let diffDay = moment(todayFormated).diff(moment(eventRepeat.startDate).format(dateFormat), 'days');
            if (diffDay!==0 && diffDay % totalDaysInMonth === 0 && moment(todayFormated).isBefore(moment(eventRepeat.endDate).format(dateFormat))) {
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
              stats: {
                totalParticipants: 0
              }
            };
            kernel.model.Event(newEvent).save().then(saved => {
              var url = kernel.config.baseUrl + 'event/'+saved._id;
              async.each(saved.participantsId, (id, callback) => {
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
                    // get uniq userIds
                    userIds = _.map(_.groupBy(userIds, (doc) => {
                      return doc;
                    }), (grouped) => {
                      return grouped[0];
                    });
                    // if event owner liked his event then remove his' _id from userIds list
                    let index = _.findIndex(userIds, (id) => {
                      return id.toString()===event.ownerId.toString();
                    });
                    if (index !== -1) {
                      userIds.splice(index, 1);
                    }
                    _cb(null, userIds);
                  }
                ], (err, result) => {
                  if (err) {
                    return cb(err);
                  }
                  async.each(result, (userId, _callback) => {
                    // Create new event invitation
                    let invite = new kernel.model.InvitationRequest({
                      fromUserId: saved.ownerId,
                      toUserId: userId,
                      objectId: saved._id
                    });
                    invite.save(_callback);
                  }, () => {
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
            cb();
          }
        }
      ], () => {
        callback();
      });
    }, () => {
      console.log("Done create repeat event");
      cb();
    });
  }).catch(err => {
    console.log("Error when create repeat event");
    cb(err);
  });
};