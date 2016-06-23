module.exports = {
  Report(kernel) {
    let Schema = kernel.mongoose.Schema;
    let reportSchema = new Schema({
    	reporterId: kernel.mongoose.Schema.Types.ObjectId,
    	description: String,
    	eventId: kernel.mongoose.Schema.Types.ObjectId,
    	userId: kernel.mongoose.Schema.Types.ObjectId,
    	type: {type: String, enum: ['user', 'event']},
    	checked: {
    		status: {type: Boolean, default: false},
    		by: kernel.mongoose.Schema.Types.ObjectId
    	}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    reportSchema.plugin(kernel.schema.timestamp);

    return reportSchema;
  }
};