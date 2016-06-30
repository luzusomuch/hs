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
          imagePath: 'pathToImage',
          type: 'food',
        }, {
          name: 'Cat B',
          description: 'Cat B description',
          imagePath: 'pathToImage',
          type: 'action'
        }, {
          name: 'Cat C',
          description: 'Cat C description',
          imagePath: 'pathToImage',
          type: 'eco'
        }, {
          name: 'Cat D',
          description: 'Cat D description',
          imagePath: 'pathToImage',
          type: 'social'
        }, {
          name: 'Cat E',
          description: 'Cat E description',
          imagePath: 'pathToImage',
          type: 'internation'
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
