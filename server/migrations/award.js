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
          objectDescription: 'Award 1 description',
          objectPhotoId: result.photos[0]._id
        }, {
          ownerId: result.users[1]._id,
          objectName: 'Award 2',
          objectDescription: 'Award 2 description',
          objectPhotoId: result.photos[1]._id
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
