module.exports = {
  Relation(kernel) {
    let Schema = kernel.mongoose.Schema;
    let relationSchema = new Schema({
    	fromUserId: kernel.mongoose.Schema.Types.ObjectId,
    	toUserId: kernel.mongoose.Schema.Types.ObjectId,
    	type: {type: String, enum: ['friend', 'follow']},
    	status: {type: String, enum: ['pending', 'completed']}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    relationSchema.plugin(kernel.schema.timestamp);

    return relationSchema;
  }
};