/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (CategoryModel, cb) => {
  async.waterfall([
    (cb) => {
      CategoryModel.find({})
      .remove()
      .then(() => {
        CategoryModel.create({
          name: 'Cat A',
          description: 'Cat A description',
          imagePath: 'pathToImage'
        }, {
          name: 'Cat B',
          description: 'Cat B description',
          imagePath: 'pathToImage'
        })
        .then(() => {
          console.log('finished populating categories');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
