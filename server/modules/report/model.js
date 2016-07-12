module.exports = {
  Report(kernel) {
    let Schema = kernel.mongoose.Schema;
    let reportSchema = new Schema({
    	reporterId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
    	description: String,
    	reportedItemId: kernel.mongoose.Schema.Types.ObjectId,
    	type: {type: String, enum: ['User', 'Event', 'Photo', 'Comment']},
        checked: {type: Boolean, default: false},
        checkedBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    reportSchema.plugin(kernel.schema.timestamp);

    return reportSchema;
  }
};