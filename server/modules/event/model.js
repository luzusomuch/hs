module.exports = {
  Event(kernel) {
    let Schema = kernel.mongoose.Schema;
    let eventSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	name: String,
    	description: String,
    	categoryId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Category'},
    	tags: [String],
    	startDateTime: Date,
    	endDateTime: Date,
    	// organizerId: kernel.mongoose.Schema.Types.ObjectId,
    	awardId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Award'},
    	participantsId: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}],
    	photosId: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}],
    	public: Boolean,
      publicStatusBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	location: {
        coordinates: [Number],
        fullAddress: String,
        country: String,
        countryCode: String,
        city: String,
        state: String,
        zipCode: String,
        type: {type: String, default: 'Point'}
      },
      blocked: {type: Boolean, default: false},
      blockedByUserId : {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
      repeat: {
        daily: {
          repeating: {type: Boolean, default: false},
          startDate: Date,
          endDate: Date,
        },
      	weekly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //1 is monday, 2 is tuesday and so on
      		totalRepeatDay: Number, //Maybe it could repeat in 1, 2 or more day
          startDate: Date,
          endDate: Date,
      	},
      	monthly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //number of day in a month
      		repeatMonth: Number, //number of month for repeating from 1 to 12
      		totalRepeatDay: Number, //Maybe it could repeat in 1, 2 or more day
          startDate: Date,
          endDate: Date,
      	},
      	yearly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //number of day in a month
      		repeatMonth: Number, //number of month for repeating from 1 to 12
      		totalRepeatDay: Number, //Maybe it could repeat in 1, 2 or more day
          startDate: Date,
          endDate: Date,
      	}
      }
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    eventSchema.plugin(kernel.schema.timestamp);

    return eventSchema;
  }
};