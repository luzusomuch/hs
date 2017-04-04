/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (ES, UserModel, cb) => {
  async.waterfall([
    (cb) => {
      UserModel.find({})
      .remove()
      .then(() => {
        let users = [{
          provider: 'local',
          name: 'Test User',
          email: 'test@example.com',
          password: 'test'
        }, {
          provider: 'local',
          name: 'Vinh Nguyen',
          email: 'luzusomuch@gmail.com',
          password: '123456'
        }, {
          provider: 'local',
          role: 'admin',
          name: 'Admin',
          email: 'admin@example.com',
          password: 'admin',
          emailVerified: true
        }];
        async.each(users, (user, callback) => {
          UserModel.create(user).then(saved => {
            ES.create({type: ES.config.mapping.userType, id: saved._id.toString(), data: saved}, callback);
          }).catch(callback);
        }, () => {
          console.log('finished populating users');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
