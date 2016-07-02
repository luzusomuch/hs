/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (PhotoModel, UserModel, AwardModel, cb) => {
  async.waterfall([
  	(cb) => {
  		UserModel.find({}).then(users => {
  			cb(null, {users: users});
  		});
  	},
  	(result, cb) => {
  		PhotoModel.find({}).then(photos => {
  			result.photos = photos;
  			cb(null, result);
  		})
  	},
    (result, cb) => {
      AwardModel.find({})
      .remove()
      .then(() => {
        AwardModel.create({
          ownerId: result.users[0]._id,
          objectName: 'Award 1',
          objectPhotoId: result.photos[0]._id,
          type: 'accepted'
        }, {
          ownerId: result.users[1]._id,
          objectName: 'Award 2',
          objectPhotoId: result.photos[1]._id,
          type: 'gps'
        })
        .then(() => {
          console.log('finished populating awards');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
