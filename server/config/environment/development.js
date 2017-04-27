'use strict';

import path from 'path';

// Development specific configuration
// ==================================
var baseUrl = 'http://localhost:9000/';
var socketUrl = 'http://localhost:9000/';
var HOST = '127.0.0.1';
// redis host
var redisHost = process.env.REDIS_HOST || '35.157.152.138';

var APIConnection = 'http://localhost:9000/';
module.exports = {
  baseUrl: baseUrl,
  socketUrl: socketUrl,
  HOST: HOST,
  redisHost: redisHost,
  APIConnection: APIConnection,
  // MongoDB connection options
  MONGO_URL: 'mongodb://'+HOST+'/healthstars-dev',
  MONGO_REPLICAS_NUMBER: null,
  HTTP_PORT: 9000,
  PUBLIC_PATHS: [
    path.resolve('./.tmp'),
    path.resolve('./client')
  ],

  REDIS: {
    port: 6379,
    host: redisHost,
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
      host: redisHost,
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
    clientID:     process.env.FACEBOOK_ID || '1573466596291608',
    clientSecret: process.env.FACEBOOK_SECRET || 'f00bb8424ab1521b1c7c6a844b378357',
    callbackURL:  baseUrl + 'auth/facebook/callback'
  },

  TWITTER: {
    clientID:     process.env.TWITTER_ID || 'Qd9Qf8FXDTf6qf2cRtQV8Kss2',
    clientSecret: process.env.TWITTER_SECRET || 'VcQtq1rnOQZGe91sTzasAMVhEADLpHbRZpVbLQpQ7DZfB7X7yj',
    callbackURL:  baseUrl + 'auth/twitter/callback'
  },

  GOOGLE: {
    clientID:     process.env.GOOGLE_ID || '415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || '4PloEPjhy6jQt3toY0cDzQ4A',
    callbackURL:  baseUrl + 'auth/google/callback'
  },

  HOTMAIL: {
    clientSecret: process.env.HOTMAIL_SECRET || 'ux5VvaC9qGqZiV1f44oSDcw',
    clientID: process.env.HOTMAIL_ID || 'f6f1fb5a-0120-4336-9a00-a0f210e5b125',
    // callbackURL: baseUrl + 'api/v1/users/hotmail-contacts'
    callbackURL: baseUrl + 'profile/'
  },

  weather: '94d68bfa4200b08d42fd600cf0e3ca86',
};
