module.exports = {
  Photo(kernel) {
    let Schema = kernel.mongoose.Schema;
    let photoSchema = new Schema({
      objectId: kernel.mongoose.Schema.Types.ObjectId,
      ownerId: kernel.mongoose.Schema.Types.ObjectId,
      metadata: {},
      liked: kernel.mongoose.Schema.Types.ObjectId,
      shared: kernel.mongoose.Schema.Types.ObjectId,
      comments: kernel.mongoose.Schema.Types.ObjectId,
      blocked: {
      	status: {type: Boolean, default: false},
      	byUserId: kernel.mongoose.Schema.Types.ObjectId
      }
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    photoSchema.plugin(kernel.schema.timestamp);

    return photoSchema;
  }
};