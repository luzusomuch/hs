/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
import { UserModel } from '../models';
import async from 'async';

module.exports = (cb) => {
  async.waterfall([
    (cb) => {
      UserModel.find({})
      .remove()
      .then(() => {
        UserModel.create({
          provider: 'local',
          name: 'Test User',
          email: 'test@example.com',
          password: 'test'
        }, {
          provider: 'local',
          role: 'admin',
          name: 'Admin',
          email: 'admin@example.com',
          password: 'admin'
        })
        .then(() => {
          console.log('finished populating users');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
