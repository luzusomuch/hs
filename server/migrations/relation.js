/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (RelationModel, UserModel, cb) => {
  async.waterfall([
  	(cb) => {
  		UserModel.find({}).then(users => {
  			cb(null, users);
  		});
  	},
    (usersList, cb) => {
      RelationModel.find({})
      .remove()
      .then(() => {
        RelationModel.create({
          fromUserId: usersList[0]._id,
          toUserId: usersList[1]._id,
          type: 'friend',
          status: 'pending'
        }, {
          fromUserId: usersList[0]._id,
          toUserId: usersList[1]._id,
          type: 'follow',
          status: 'completed'
        })
        .then(() => {
          console.log('finished populating relations');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
