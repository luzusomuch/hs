/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (ThreadModel, UserModel, cb) => {
  async.waterfall([
  	(cb) => {
  		UserModel.find({}).then(users => {
  			cb(null, users);
  		});
  	},
    (usersList, cb) => {
      ThreadModel.find({})
      .remove()
      .then(() => {
        ThreadModel.create({
        	name: 'Thread 1',
        	toUserId: usersList[1]._id,
          fromUserId: usersList[0]._id,
          tags: ['abc', 'def'],
          messages: [{
          	sentUserId: usersList[1]._id,
          	message: 'message 1 thread 1',
          	createdAt: new Date()
          }, {
          	sentUserId: usersList[0]._id,
          	message: 'message 2 thread 1',
          	createdAt: new Date()
          }]
        }, {
          name: 'Thread 2',
        	toUserId: usersList[0]._id,
          fromUserId: usersList[1]._id,
          tags: ['abc', 'def', 'ilk'],
          messages: [{
          	sentUserId: usersList[1]._id,
          	message: 'message 1 thread 2',
          	createdAt: new Date()
          }, {
          	sentUserId: usersList[0]._id,
          	message: 'message 2 thread 2',
          	createdAt: new Date()
          }]
        })
        .then(() => {
          console.log('finished populating threads');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
