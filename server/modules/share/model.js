import moduleConfig from './moduleconfig';

module.exports = {
  Share(kernel) {
    let Schema = kernel.mongoose.Schema;
    let shareSchema = new Schema({
      objectName: String,
      objectId: kernel.mongoose.Schema.Types.ObjectId,
      ownerId: kernel.mongoose.Schema.Types.ObjectId
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    shareSchema.plugin(kernel.schema.timestamp);

    shareSchema.post('save', (doc) => {
      let attachModel = kernel.model;
      if (!attachModel[doc.objectName]) {
        //do nothing
        return;
      }
      //otherwise increase totalShare
      //TODO - fire event such as totalShare added to all subscriber
      attachModel[doc.objectName].findByIdAndUpdate(doc.objectId, {$inc: {totalShare: 1}}).then(data => {
      	if (doc.objectName==='Event') {
      		data.set('totalShare', data.get('totalShare') + 1);
      		kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: data._id.toString(), data: data}).save();
      	}
      }).catch(err => {
      	console.log(err);
      	return;
      });
    });

    return shareSchema;
  }
};