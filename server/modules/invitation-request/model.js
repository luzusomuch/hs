module.exports = {
  InvitationRequest(kernel) {
    let Schema = kernel.mongoose.Schema;
    let invitationRequestSchema = new Schema({
    	fromUserId: kernel.mongoose.Schema.Types.ObjectId,
    	toUserId: kernel.mongoose.Schema.Types.ObjectId,
        objectId: kernel.mongoose.Schema.Types.ObjectId
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    invitationRequestSchema.plugin(kernel.schema.timestamp);

    return invitationRequestSchema;
  }
};