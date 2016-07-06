import moduleConfig from './moduleconfig';

module.exports = {
  Like(kernel) {
    let Schema = kernel.mongoose.Schema;
    let likeSchema = new Schema({
      objectName: String,
      objectId: kernel.mongoose.Schema.Types.ObjectId,
      ownerId: kernel.mongoose.Schema.Types.ObjectId
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    likeSchema.plugin(kernel.schema.timestamp);

    likeSchema.post('save', (doc) => {
      let attachModel = kernel.model;
      if (!attachModel[doc.objectName]) {
        //do nothing
        return;
      }
      //otherwise increase totalLike
      //TODO - fire event such as totalLike added to all subscriber
      attachModel[doc.objectName].findByIdAndUpdate(doc.objectId, {$inc: {totalLike: 1}}).then(data => {
      	if (doc.objectName==='Event') {
      		data.set('totalLike', data.get('totalLike') + 1);
      		kernel.queue.create(kernel.config.ES.events.UPDATE, {type: kernel.config.ES.mapping.eventType, id: data._id.toString(), data: data}).save();
      	}
      }).catch(err => {
      	console.log(err);
      	return;
      });
    });

    return likeSchema;
  }
};