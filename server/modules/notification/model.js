module.exports = {
  Notification(kernel) {
    let Schema = kernel.mongoose.Schema;
    let notificationSchema = new Schema({
    	ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    	fromUserId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    	toUserId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    	// we have some types like: friend-request, attend-event, pass-admin-role, liked-event, event-invitation
    	type: {type: String, required: true},
    	element: {},
    	// update this when user has read notification
    	read: {type: Boolean, default: false}
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    notificationSchema.plugin(kernel.schema.timestamp);

    return notificationSchema;
  }
};