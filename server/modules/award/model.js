module.exports = {
  Award(kernel) {
    let Schema = kernel.mongoose.Schema;
    let awardSchema = new Schema({
      objectName: String,
      objectDescription: String,
      objectPhotoId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Photo'},
      // objectId: kernel.mongoose.Schema.Types.ObjectId,
      ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    awardSchema.plugin(kernel.schema.timestamp);

    return awardSchema;
  }
};