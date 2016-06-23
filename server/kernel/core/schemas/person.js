module.exports = exports = function(kernel) {
  var Schema = kernel.mongoose.Schema;

  /**
   * @ngdoc function
   * @name schema.person
   * @description
   * Mongoose Plugin helper to add schema.org's Person properties
   * @param {object} schema the schema which will be added with the Person properties
   * @param {object} options the option object
   */
  var person = function (schema, options) {
    schema.defaults({
      address: Schema.Types.Mixed,
      friends: Schema.Types.ObjectId,
      followers: Schema.Types.ObjectId,
      notificationSetting: {
        isVisibleFriendsList: {type: Boolean, defaults: false},
        invitedToEvent: {type: Boolean, defaults: true},
        friendInvitation: {type: Boolean, defaults: true},
        newPost: {type: Boolean, defaults: true},
      },
      avatar: Schema.Types.ObjectId,
      coverPhoto: Schema.Types.ObjectId,
      awardsExhibits: [{
        rank: Number,
        awardId: Schema.Types.ObjectId
      }],
      currentLocation: {
        coordinates: [Number],
        fullAddress: String,
        country: String,
        countryCode: String,
        city: String,
        state: String,
        zipCode: String
      },
      about: String,
      gender: {type: String, enum: ['male', 'female', 'others']},
      birthDate: Date,
      phoneNumber: String,
      lastAccess: Date,
      deleted: {
        status: {type: Boolean, default: false},
        by: Schema.Types.ObjectId
      },
      blocked: {
        status: {type: Boolean, default: false},
        by: Schema.Types.ObjectId
      }
    });
  };

  return person;
};
