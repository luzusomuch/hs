module.exports = {
  Thread(kernel) {
    let Schema = kernel.mongoose.Schema;
    let threadSchema = new Schema({
    	name: String,
    	fromUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	toUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	tags: [String],
    	messages: [{
    		sentUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    		message: String,
    		createdAt: Date,
            deleted: {type: Boolean, default: false},
            deletedByUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    	}],
        blocked: {type: Boolean, default: false},
        blockedByUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
        nonReceiveEmailUsers: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}]
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    threadSchema.plugin(kernel.schema.timestamp);

    return threadSchema;
  }
};