'use strict';
import async from 'async';
import moment from 'moment';

module.exports = (kernel, cb) => {
  let dateFormat = 'YYYY-MM-DD HH:mm';
  let todayFormated = moment().format(dateFormat);
  let yesterdayFormated = moment().subtract(1, 'days').format(dateFormat);

  // Get all user
  kernel.model.User.find({}).then(users => {
  	async.each(users, (user, callback) => {
  		async.waterfall([
  			(cb) => {
		  		// Get all interested event of an user
		  		kernel.model.Like.find({objectName: 'Event', ownerId: user._id}).then(result => {
		  			cb(null, result)
		  		}).catch(err => {
		  			cb(err);
		  		});
  			},
  			(result, cb) => {
  				// Get all feed of an event
					let newFeeds = [];
  				async.each(result, (liked, callback) => {
  					kernel.model.Feed.find({eventId: liked.objectId})
  					.populate('eventId')
  					.populate('ownerId').exec().then(feeds => {
  						async.each(feeds, (feed, cb) => {
  							if (feed.ownerId._id.toString()!==user._id.toString() && moment(moment(feed.createdAt).format(dateFormat)).isBetween(yesterdayFormated, todayFormated)) {
  								newFeeds.push({feed: feed, url: kernel.config.baseUrl + 'event/detail/'+feed.eventId._id});
  								cb();
  							} else {
  								cb();
  							}
  						}, callback);
  					}).catch(err => {
  						callback(err);
  					});
  				}, (err) => {
  					if (err) {
  						return cb(err);
  					}
  					if (newFeeds.length > 0) {
	  					kernel.emit('SEND_MAIL', {
                template: 'new-post-in-interesting-event.html',
                subject: 'Your interesting events have new posts',
                data: {
                  user: user, 
                  newFeeds: newFeeds
                },
                to: user.email
              });
  					}
            cb();
  				});
  			}
  		], callback);
  	}, (err) => {
  		if (err) {
  			console.log(err);
  		}
  		console.log('Done process new post');
  		cb();
  	});
  }).catch(cb);
};