'use strict';

var path = require('path');
var _ = require('lodash');
var baseUrl = 'http://healthstars.dev/';
function requiredProcessEnv(name) {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  baseUrl: baseUrl,
  
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  SECRETS: {
    session: 'app-secret'
  },

  FACEBOOK: {
    clientID:     process.env.FACEBOOK_ID || '151467955264025',
    clientSecret: process.env.FACEBOOK_SECRET || 'b3fb8c3ac0b6fb90f6d4849128c7ac18',
    callbackURL:  baseUrl + 'auth/facebook/callback'
  },

  TWITTER: {
    clientID:     process.env.TWITTER_ID || 'Qd9Qf8FXDTf6qf2cRtQV8Kss2',
    clientSecret: process.env.TWITTER_SECRET || 'VcQtq1rnOQZGe91sTzasAMVhEADLpHbRZpVbLQpQ7DZfB7X7yj',
    callbackURL:  baseUrl + 'auth/twitter/callback'
  },

  GOOGLE: {
    clientID:     process.env.GOOGLE_ID || '370450171698-3mng1t1reg27ughuh1jn80ilhaj0rfum.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || 'ZJ08JCu7ECso7Y9GgZg_6BUw',
    callbackURL:  baseUrl + 'auth/google/callback'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./shared'),
  require('./' + process.env.NODE_ENV + '.js') || {});
