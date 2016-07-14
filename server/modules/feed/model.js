module.exports = {
  Feed(kernel) {
    let Schema = kernel.mongoose.Schema;
    let feedSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    	content: String,
    	photosId: [{type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Photo'}],
    	eventId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
      blocked: {type: Boolean, default: false},
      blockedByUserId : {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User'}
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    feedSchema.plugin(kernel.schema.timestamp);

    feedSchema.pre('save', function(next) {
      this.wasNew = this.isNew;
      next();
    });

    feedSchema.post('save', (doc) => {
      if (doc.wasNew) {
        let attachModel = kernel.model;
        //TODO - fire event such as totalcomment added to event detail
        attachModel.Event.findByIdAndUpdate(doc.eventId, {$inc: {totalComment: 1}}).then(data => {
          data.set('totalComment', data.get('totalComment') + 1);
          kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: data._id.toString(), data: data}).save();
        }).catch(err => {
          console.log(err);
          return;
        });
      }
    });

    return feedSchema;
  }
};