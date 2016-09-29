module.exports = {
  CompanyAccountRequest(kernel) {
    let Schema = kernel.mongoose.Schema;
    let companyAccountRequestSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    companyAccountRequestSchema.plugin(kernel.schema.timestamp);

    return companyAccountRequestSchema;
  }
};