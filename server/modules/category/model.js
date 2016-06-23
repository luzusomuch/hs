module.exports = {
  Category(kernel) {
    let Schema = kernel.mongoose.Schema;
    let categorySchema = new Schema({
      name: String,
    	description: String,
    	imagePath: String,
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    categorySchema.plugin(kernel.schema.timestamp);

    return categorySchema;
  }
};