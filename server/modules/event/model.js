module.exports = {
  Event(kernel) {
    let Schema = kernel.mongoose.Schema;
    let eventSchema = new Schema({
    	ownerId: kernel.mongoose.Schema.Types.ObjectId,
    	name: String,
    	description: String,
    	category: kernel.mongoose.Schema.Types.ObjectId,
    	tags: [String],
    	startDateTime: Date,
    	endDateTime: Date,
    	organizerId: kernel.mongoose.Schema.Types.ObjectId,
    	awardsId: [kernel.mongoose.Schema.Types.ObjectId],
    	participantsId: [kernel.mongoose.Schema.Types.ObjectId],
    	photosId: [kernel.mongoose.Schema.Types.ObjectId],
    	public: {
    		type: {type: Boolean, default: true},
    		by: kernel.mongoose.Schema.Types.ObjectId
    	},
    	location: {
        coordinates: [Number],
        fullAddress: String,
        country: String,
        countryCode: String,
        city: String,
        state: String,
        zipCode: String
      },
      blocked: {
      	status: {type: Boolean, default: false},
      	by: kernel.mongoose.Schema.Types.ObjectId
      },
      repeat: {
      	weekly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //1 is monday, 2 is tuesday and so on
      		totalRepeatDay: Number //Maybe it could repeat in 1, 2 or more day
      	},
      	monthly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //number of day in a month
      		repeatMonth: Number, //number of month for repeating from 1 to 12
      		totalRepeatDay: Number //Maybe it could repeat in 1, 2 or more day
      	},
      	yearly: {
      		repeating: {type: Boolean, default: false},
      		repeatDay: Number, //number of day in a month
      		repeatMonth: Number, //number of month for repeating from 1 to 12
      		totalRepeatDay: Number //Maybe it could repeat in 1, 2 or more day
      	}
      }
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    eventSchema.plugin(kernel.schema.timestamp);

    return eventSchema;
  }
};