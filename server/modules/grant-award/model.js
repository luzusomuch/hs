module.exports = {
  GrantAward(kernel) {
    let Schema = kernel.mongoose.Schema;
    let grantAwardSchema = new Schema({
    	ownerId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    	awardId: {type: kernel.mongoose.Schema.Types.ObjectId, ref: 'Award', required: true},
    });
    
    //import timestamp for auto create updatedAt, createdAt field manually
    grantAwardSchema.plugin(kernel.schema.timestamp);

    return grantAwardSchema;
  }
};