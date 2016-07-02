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
        type: {type: String, enum: ['daily', 'weekly', 'monthly', 'none']},
        startDate: Date,
        endDate: Date
      },
      private: Boolean
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    eventSchema.plugin(kernel.schema.timestamp);

    return eventSchema;
  }
};