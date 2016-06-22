import moduleConfig from './moduleconfig';

//TODO - create config
exports.config = {};

exports.name = 'Award';
exports.model = require('./model');
exports.routes = require('./routes');
exports.module = moduleConfig.publishModule;
