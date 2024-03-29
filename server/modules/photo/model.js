module.exports = {
  Photo(kernel) {
    let Schema = kernel.mongoose.Schema;
    let photoSchema = new Schema({
      filename: String,
      ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
      metadata: {},
      keyUrls: {},
      blocked: {type: Boolean, default: false},
      blockedBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
      type: {type: String}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    photoSchema.plugin(kernel.schema.timestamp);

    return photoSchema;
  }
};