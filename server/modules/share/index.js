import moduleConfig from './moduleconfig';

//TODO - create config
exports.config = {};

exports.name = 'Share';
exports.model = require('./model');
exports.routes = require('./routes');
exports.module = moduleConfig.publishModule;
