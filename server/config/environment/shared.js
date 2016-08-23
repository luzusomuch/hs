'use strict';
let env = process.env.NODE_ENV || 'development';
let config = require('./' + env + '.js');

exports = module.exports = {
  // List of user roles
  userRoles: ['guest', 'user', 'admin'],
  baseUrl: config.baseUrl,
  socketUrl: config.socketUrl,
  apiVer : 'v1',
  apiKey: {
  	// google: 'AIzaSyCLpMBiJ3YEMigY0dRLHlS3oH85vRdwXLQ',
    google: 'AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38',
  	weather: 'd6ce4efe26d8a70511337db70401d39c',
  	fbAppId: config.FACEBOOK.clientID,
    twAppId: config.TWITTER.clientID,
    ggAppId: config.GOOGLE.clientID
  }
};
