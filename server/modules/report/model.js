module.exports = {
  Report(kernel) {
    let Schema = kernel.mongoose.Schema;
    let reportSchema = new Schema({
    	reporterId: kernel.mongoose.Schema.Types.ObjectId,
    	description: String,
    	reportedItemId: kernel.mongoose.Schema.Types.ObjectId,
    	type: {type: String, enum: ['user', 'event', 'photo', 'comment']},
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