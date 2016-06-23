module.exports = {
  DeviceToken(kernel) {
    let Schema = kernel.mongoose.Schema;
    let deviceTokenSchema = new Schema({
    	userId: kernel.mongoose.Schema.Types.ObjectId,
    	platform: String,
    	token: String
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    deviceTokenSchema.plugin(kernel.schema.timestamp);

    return deviceTokenSchema;
  }
};