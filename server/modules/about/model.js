module.exports = {
  About(kernel) {
    let Schema = kernel.mongoose.Schema;
    let aboutSchema = new Schema({
      content: String,
      language: String
    });

    //import timestamp for auto create updatedAt, createdAt field manually
    aboutSchema.plugin(kernel.schema.timestamp);

    return aboutSchema;
  }
};