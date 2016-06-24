/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (PhotoModel, UserModel, cb) => {
  async.waterfall([
  	(cb) => {
  		UserModel.find({}).then(users => {
  			cb(null, users);
  		});
  	},
    (usersList, cb) => {
      PhotoModel.find({})
      .remove()
      .then(() => {
        PhotoModel.create({
          ownerId: usersList[0]._id,
          metadata: {
          	small: 'pathToSmallImage',
          	medium: 'pathToMediumImage',
          	large: 'pathToLargeImage',
          }
        }, {
          ownerId: usersList[1]._id,
          metadata: {
          	small: 'pathToSmallImage',
          	medium: 'pathToMediumImage',
          	large: 'pathToLargeImage',
          }
        })
        .then(() => {
          console.log('finished populating photos');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
