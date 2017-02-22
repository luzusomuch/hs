'use strict';

import path from 'path';

// Development specific configuration
// ==================================
var baseUrl = process.env.baseUrl || 'http://ec2-35-156-202-106.eu-central-1.compute.amazonaws.com/';
// testing
var socketUrl = process.env.socketUrl || 'http://ec2-35-156-202-106.eu-central-1.compute.amazonaws.com:9000/';
// real
// var socketUrl = 'http://35.163.48.227:9000/';
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

  GOOGLE: {
    clientID:     process.env.GOOGLE_ID || '415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || '4PloEPjhy6jQt3toY0cDzQ4A',
    callbackURL:  baseUrl + 'auth/google/callback'
  },

  HOTMAIL: {
    clientSecret: process.env.HOTMAIL_SECRET || 'DagvPqegnoAY9Mbj6pp1SMV',
    clientID: process.env.HOTMAIL_ID || '8d9ca6b9-d2f8-4afd-9274-557e4ca4aab5',
    // callbackURL: baseUrl + 'api/v1/users/hotmail-contacts'
    callbackURL: baseUrl + 'profile/'
  }
};
