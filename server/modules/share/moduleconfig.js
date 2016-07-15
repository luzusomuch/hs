let _acceptObject = {};

exports.getAcceptObject = function() {
  return _acceptObject;
};

exports.publishModule = function(kernel) {
  function totalShare(schema) {
    schema.defaults({
      totalShare: {
        type: Number,
        default: 0
      }
    });
  }

  return {
    /**
     * attach mongose model to config
     * @param  {Mixed} modelName model name of mongoose model
     * @param  {Object} options   Custom options for the config
     * @return {void}
     */
    attachModel(model, options) {
      //TODO - upgrate module with options
      options = options || {};
      if (typeof model === 'string') {
        if (!kernel.model[model]) {
          return console.warn(`${model} does not exist in kernel model!`);
        }

        //attach mongoose plugin
        kernel.model[model].schema.plugin(totalShare);
        //TODO - bind more option from config
        _acceptObject[model] = kernel.model[model];
      } else if (model.schema instanceof kernel.mongoose.Schema){
        model.schema.plugin(totalShare);
        _acceptObject[model.modelName] = model;
      } else {
        return console.warn(`${model} is not valid mongoose model, we dont support right now!`);
      }
    }
  };
};

