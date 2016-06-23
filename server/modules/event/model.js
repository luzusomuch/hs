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

    });

    //import timestamp for auto create updatedAt, createdAt field manually
    eventSchema.plugin(kernel.schema.timestamp);

    return eventSchema;
  }
};