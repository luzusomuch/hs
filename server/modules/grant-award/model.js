module.exports = {
  GrantAward(kernel) {
    let Schema = kernel.mongoose.Schema;
    let grantAwardSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        awardId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Award', required: true},
    	eventId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
        deleted: {type: Boolean, default: false},
        deletedBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    grantAwardSchema.plugin(kernel.schema.timestamp);

    return grantAwardSchema;
  }
};