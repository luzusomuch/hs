module.exports = {
  Award(kernel) {
    let Schema = kernel.mongoose.Schema;
    let awardSchema = new Schema({
      objectName: String,
      objectPhotoId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Photo'},
      ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
      allowToUseType: {type: String, enum: ['owner', 'friend', 'all']},
      allowToUse: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}],
      // this type of award will be use for grant to user base on type
        // accepted is for every user who accepted an event
        // gps is for every user who has gps signed from healthstar app
        // organizer meant that award will be granted by organizer
        // offline will be granted offline by healthstars (for company accounts only)
      type: {type: String, enum: ['accepted', 'gps', 'organizer', 'offline']},
      deleted: {type: Boolean, default: false},
      deletedBy: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    awardSchema.plugin(kernel.schema.timestamp);

    return awardSchema;
  }
};