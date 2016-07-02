'use strict';

var path = require('path');

// Development specific configuration
// ==================================
var baseUrl = 'http://ec2-52-41-132-71.us-west-2.compute.amazonaws.com/';
module.exports = {
  baseUrl: baseUrl,
  // MongoDB connection options
  MONGO_URL: 'mongodb://localhost/healthstars-dev',
  MONGO_REPLICAS_NUMBER: null,
  HTTP_PORT: 9000,
  PUBLIC_PATHS: [
    path.resolve('./.tmp'),
    path.resolve('./client')
  ],

  REDIS: {
    port: 6379,
    host: '127.0.0.1',
    db: 3, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclient
    }
  },
  SECRETS: {
    session: 'app-secret'
  },
  tmpFolder: path.resolve(__dirname, '../..//assets/.tmp'),
  tmpPhotoFolder: path.resolve(__dirname, '../../..//client/assets/photos'),
  watermarkFile: path.resolve(__dirname, '../../assets/watermark.png'),
  AWS: {
    accessKeyId: 'AKIAI7KKFT6PBJRLBZKQ',
    secretAccessKey: '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',
    region: 'us-west-2'
  },
  FACEBOOK: {
    clientID:     process.env.FACEBOOK_ID || '1405403066433083',
    clientSecret: process.env.FACEBOOK_SECRET || '9e14990db2e80a07c27ca626e12b2284',
    callbackURL:  baseUrl + 'auth/facebook/callback'
  },

  TWITTER: {
    clientID:     process.env.TWITTER_ID || 'NBwHIfLe0uEq8X9DsZpXptAtT',
    clientSecret: process.env.TWITTER_SECRET || '9k6YDexW81vfjR0IsUNK00QeMZdVSkplReZARS1X46dUFjeYuB',
    callbackURL:  baseUrl + 'auth/twitter/callback'
  },

  GOOGLE: {
    clientID:     process.env.GOOGLE_ID || '370450171698-3mng1t1reg27ughuh1jn80ilhaj0rfum.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || 'ZJ08JCu7ECso7Y9GgZg_6BUw',
    callbackURL:  baseUrl + 'auth/google/callback'
  },
  S3: {
    bucket: 'hvs3'
  }
};
