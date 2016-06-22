module.exports = {
  Award(kernel) {
    let Schema = kernel.mongoose.Schema;
    let awardSchema = new Schema({
      objectName: String,
      objectDescription: String,
      objectPhotoId: kernel.mongoose.Schema.Types.ObjectId,
      objectId: kernel.mongoose.Schema.Types.ObjectId,
      ownerId: kernel.mongoose.Schema.Types.ObjectId
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    awardSchema.plugin(kernel.schema.timestamp);

    return awardSchema;
  }
};