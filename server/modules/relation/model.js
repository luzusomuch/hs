module.exports = {
  Relation(kernel) {
    let Schema = kernel.mongoose.Schema;
    let relationSchema = new Schema({
    	fromUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	toUserId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	type: {type: String, enum: ['friend', 'follow']},
    	status: {type: String, enum: ['pending', 'completed', 'deleted']}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    relationSchema.plugin(kernel.schema.timestamp);

    return relationSchema;
  }
};