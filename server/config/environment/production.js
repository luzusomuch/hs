'use strict';

import path from 'path';

// Development specific configuration
// ==================================
var baseUrl = 'http://ec2-52-41-38-203.us-west-2.compute.amazonaws.com/';
var socketUrl = 'http://52.41.38.203:9000/';
module.exports = {
  baseUrl: baseUrl,
  socketUrl: socketUrl,
  // MongoDB connection options
  MONGO_URL: 'mongodb://localhost/healthstars',
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

  REST_PREFIX: '/api/v1/',

  QUEUE_NAME: 'mean',
  QUEUE_CONFIG: {
    prefix: 'q',
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
      options: {}
    }
  },
  
  tmpFolder: path.resolve(__dirname, '../..//assets/.tmp'),
  tmpPhotoFolder: path.resolve(__dirname, '../../..//client/assets/photos'),
  tmpSoundFolder: path.resolve(__dirname, '../../..//client/assets/sound'),
  watermarkFile: path.resolve(__dirname, '../../assets/watermark.png'),
  AWS: {
    accessKeyId: 'AKIAI7KKFT6PBJRLBZKQ',
    secretAccessKey: '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',
    region: 'us-west-2'
  },
  S3: {
    bucket: 'hvs3'
  },
  FACEBOOK: {
    clientID:     process.env.FACEBOOK_ID || '1564026697235598',
    clientSecret: process.env.FACEBOOK_SECRET || 'd0eb1d0eebffe1db90a7cc187d3437b9',
    callbackURL:  baseUrl + 'auth/facebook/callback'
  },

  TWITTER: {
    clientID:     process.env.TWITTER_ID || 'NBwHIfLe0uEq8X9DsZpXptAtT',
    clientSecret: process.env.TWITTER_SECRET || '9k6YDexW81vfjR0IsUNK00QeMZdVSkplReZARS1X46dUFjeYuB',
    callbackURL:  baseUrl + 'auth/twitter/callback'
  },

  TWITTER_CURRENT_USER: {
    clientID: '3craxNnvp6ew3zmfcj5LlqXmb',
    clientSecret: 'xbOUMqiwVURts9cuefhdWYgM4ShyGyra7RpeysWYtrVOiWainV',
    callbackURL: baseUrl + 'auth/twitter/user/currentUser'
  },

  GOOGLE: {
    clientID:     process.env.GOOGLE_ID || '825525519990-0uf8b2cs1i4alptais0nk53pmajpdtnr.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || '9KA0LX54f6GPsOTxW5Vhj5Sl',
    callbackURL:  baseUrl + 'auth/google/callback'
  }
};
