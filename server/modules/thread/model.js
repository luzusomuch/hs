module.exports = {
  Thread(kernel) {
    let Schema = kernel.mongoose.Schema;
    let threadSchema = new Schema({
    	name: String,
    	fromUserId: kernel.mongoose.Schema.Types.ObjectId,
    	toUserId: kernel.mongoose.Schema.Types.ObjectId,
    	tags: [String],
    	messages: [{
    		sentUserId: kernel.mongoose.Schema.Types.ObjectId,
    		message: String,
    		createdAt: Date,
    		deleted: {
    			status: {type: Boolean, default: false},
    			by: kernel.mongoose.Schema.Types.ObjectId
    		}
    	}]
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    threadSchema.plugin(kernel.schema.timestamp);

    return threadSchema;
  }
};