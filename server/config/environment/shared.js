'use strict';
let env = process.env.NODE_ENV || 'development';
let config = require('./' + env + '.js');

exports = module.exports = {
  // List of user roles
  userRoles: ['guest', 'user', 'admin'],
  baseUrl: config.baseUrl,
  apiVer : 'v1',
  apiKey: {
  	google: 'AIzaSyBhg6JbSzbbB1rC9iqukJdiAXzUOYlpf-4',
  	weather: 'd6ce4efe26d8a70511337db70401d39c'
  }
};
