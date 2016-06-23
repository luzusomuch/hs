module.exports = {
  InvitationRequest(kernel) {
    let Schema = kernel.mongoose.Schema;
    let invitationRequestSchema = new Schema({
    	fromUserId: kernel.mongoose.Schema.Types.ObjectId,
    	toUserId: kernel.mongoose.Schema.Types.ObjectId,
    	message: String,
    	type: {type: String, enum: ['friend', 'event']},
    	status: {
    		text: {type: String, enum: ['accepted', 'canceled', 'pending'], default: 'pending'},
    		by: kernel.mongoose.Schema.Types.ObjectId
    	}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    invitationRequestSchema.plugin(kernel.schema.timestamp);

    return invitationRequestSchema;
  }
};