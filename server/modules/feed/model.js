module.exports = {
  Feed(kernel) {
    let Schema = kernel.mongoose.Schema;
    let feedSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    	content: String,
    	photosId: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Photo'}],
    	eventId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Event'},
      blocked: {type: Boolean, default: false},
      blockedByUserId : {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    feedSchema.plugin(kernel.schema.timestamp);

    return feedSchema;
  }
};