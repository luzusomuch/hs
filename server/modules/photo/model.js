module.exports = {
  Photo(kernel) {
    let Schema = kernel.mongoose.Schema;
    let photoSchema = new Schema({
      ownerId: kernel.mongoose.Schema.Types.ObjectId,
      metadata: {},
      blocked: {type: Boolean, default: false},
      blockedBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    photoSchema.plugin(kernel.schema.timestamp);

    return photoSchema;
  }
};