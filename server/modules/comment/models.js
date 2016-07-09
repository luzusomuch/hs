import moduleConfig from './moduleconfig';

module.exports = {
  Comment(kernel) {
    let Schema = kernel.mongoose.Schema;
    let commentSchema = new Schema({
      ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'},
      objectId: kernel.mongoose.Schema.Types.ObjectId,
      objectName: String, // Maybe Photo, Feed, Event or even if its a Comment
      content: String,
      isSubComment: {type: Boolean, default: false},
      deleted: {type: Boolean, default: false},
      deletedByUserId: kernel.mongoose.Schema.Types.ObjectId
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    commentSchema.plugin(kernel.schema.timestamp);

    commentSchema.post('save', (doc) => {
      let attachModel = kernel.model;
      if (!attachModel[doc.objectName]) {
        //do nothing
        return;
      }

      //otherwise increase totalcomment
      //TODO - fire event such as totalcomment added to all subscriber
      attachModel[doc.objectName].findByIdAndUpdate(doc.objectId, {$inc: {totalComment: 1}}).then(data => {
        if (doc.objectName==='Event') {
          data.set('totalComment', data.get('totalComment') + 1);
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: data._id.toString(), data: data}).save();
        }
      }).catch(err => {
        console.log(err);
        return;
      });
    });

    return commentSchema;
  }
};
