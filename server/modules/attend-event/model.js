module.exports = {
 	AttendEvent(kernel) {
	    let Schema = kernel.mongoose.Schema;
	    let attendEventSchema = new Schema({
	      	eventId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Event'},
	      	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
	    });

	    //import timestamp for auto create updatedAt, createdAt field manually
	    attendEventSchema.plugin(kernel.schema.timestamp);

	    return attendEventSchema;
  	}
};