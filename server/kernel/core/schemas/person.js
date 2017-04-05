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
      notificationSetting: {
        isVisibleFriendsList: {type: Boolean, defaults: true},
        invitedToEvent: {type: Boolean, defaults: true},
        friendInvitation: {type: Boolean, defaults: true},
        newPost: {type: Boolean, defaults: true},
      },
      avatar: {type: Schema.Types.ObjectId, ref: 'Photo'},
      coverPhoto: {type: Schema.Types.ObjectId, ref: 'Photo'},
      awardsExhibits: [{
        number: Number,
        awardId: {type: Schema.Types.ObjectId, ref: 'Award'}
      }],
      location: {
        type: {type: String}, //this type only use for mongoDB geoJSON, maybe a Point or somethings
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
        byUserId: {type: Schema.Types.ObjectId, ref: 'User'}
      },
      blocked: {
        status: {type: Boolean, default: false},
        byUserId: {type: Schema.Types.ObjectId, ref: 'User'}
      },
      emailVerified: {type: Boolean, default: false},
      emailVerifiedToken: String,
      passwordResetToken: String,
      accessViaApp: {type: Boolean, default: false},
      stats: {
        totalJoinedEvent: {type: Number, default: 0},
        totalCreatedEvent: {type: Number, default: 0}
      },
      isCompanyAccount: {type: Boolean, default: false},
      pointClub: {type: String, default: ''},
      job: {type: String, default: ''},
      hidePopupStarInfo: {type: Boolean, default: false},
      language: {type: String, default: 'en'}
    });
  };

  return person;
};
