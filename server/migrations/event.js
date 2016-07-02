/**
 * Populate DB with sample data on server start
 */

'use strict';
import async from 'async';

module.exports = (ES, EventModel, UserModel, CategoryModel, AwardModel, PhotoModel, cb) => {
  async.waterfall([
  	(cb) => {
  		UserModel.find({}).then(users => {
  			cb(null, {users: users});
  		});
  	},
  	(result, cb) => {
  		CategoryModel.find({}).then(categories => {
  			result.categories = categories;
  			cb(null, result);
  		});
  	},
  	(result, cb) => {
  		AwardModel.find({}).then(awards => {
  			result.awards = awards;
  			cb(null, result);
  		});
  	},
  	(result, cb) => {
  		PhotoModel.find({}).then(photos => {
  			result.photos = photos;
  			cb(null, result);
  		})
  	},
    (result, cb) => {
      EventModel.find({})
      .remove()
      .then(() => {
        let events = [{
          name: 'Event 1',
          description: 'Event 1 description',
          ownerId: result.users[0]._id,
          categoryId: result.categories[0]._id,
          tags: ['abc', 'def'],
          startDateTime: new Date(),
          endDateTime: new Date(),
          organizerId: result.users[0]._id,
          awardsId: result.awards[0]._id,
          participantsId: [],
          photosId: [result.photos[0]._id],
          public: true,
          private: false,
          location: {
            coordinates: [105.819189, 21.042056],
            fullAddress: "265 Hoang Hoa Tham",
            country: 'Viet Nam',
            countryCode: 'VN',
            city: 'Ho Chi Minh',
            state: 'Ho Chi Minh',
            zipCode: '+84'
          },
          repeat: {
            weekly: {
              repeating: true,
              repeatDay: 2,
              totalRepeatDay: 2
            }
          }
        }, {
          name: 'Event 2',
          description: 'Event 2 description',
          ownerId: result.users[1]._id,
          organizerId: result.users[1]._id,
          categoryId: result.categories[1]._id,
          tags: ['abc', 'def'],
          startDateTime: new Date(),
          endDateTime: new Date(),
          awardsId: result.awards[1]._id,
          participantsId: [result.users[0]._id],
          photosId: [result.photos[1]._id],
          public: false,
          private: true,
          location: {
            coordinates: [105.819189, 21.042056],
            fullAddress: "265 Hoang Hoa Tham",
            country: 'Viet Nam',
            countryCode: 'VN',
            city: 'Ha Noi',
            state: 'Ha Noi',
            zipCode: '+84'
          },
          repeat: {
            monthly: {
              repeating: true,
              repeatDay: 2,
              repeatMonth: 4,
              totalRepeatDay: 2
            }
          }
        }];
        async.each(events, (event, callback) => {
          EventModel.create(event).then(saved => {
            ES.create({type: ES.config.mapping.eventType, id: saved._id.toString(), data: saved}, callback);
          }).catch(callback);
        }, () => {
          console.log('finished populating events');
          cb();
        });
      });
    }
  ], () => {
    cb();
  });
};
