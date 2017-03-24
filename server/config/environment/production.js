'use strict';

import path from 'path';

// Development specific configuration
// ==================================
var baseUrl = process.env.baseUrl || 'http://healthstars.de/';
// testing
var socketUrl = process.env.socketUrl || 'http://healthstars.de/';
// real
// var socketUrl = 'http://35.163.48.227:9000/';

// HOST for DB, redis, elasticsearch
var HOST = process.env.HOST || '35.157.226.188';

var APIConnection = process.env.APIConnection || 'http://35.157.226.188/';

module.exports = {
  baseUrl: baseUrl,
  socketUrl: socketUrl,
  HOST: HOST,
  APIConnection: APIConnection,
  // MongoDB connection options
  MONGO_URL: 'mongodb://'+HOST+':27017/healthstars',
  MONGO_REPLICAS_NUMBER: null,
  HTTP_PORT: 9000,
  PUBLIC_PATHS: [
    path.resolve('./.tmp'),
    path.resolve('./client')
  ],

  REDIS: {
    port: 6379,
    host: HOST,
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
      host: HOST,
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
    accessKeyId: 'AKIAIBDHH22MWJP5MZDQ',
    secretAccessKey: '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',
    region: 'eu-central-1'
  },
  S3: {
    bucket: 'healthstars'
  },
  FACEBOOK: {
    clientID:     process.env.FACEBOOK_ID || '1564026697235598',
    clientSecret: process.env.FACEBOOK_SECRET || 'd0eb1d0eebffe1db90a7cc187d3437b9',
    callbackURL:  baseUrl + 'auth/facebook/callback'
  },

  TWITTER: {
    // clientID:     process.env.TWITTER_ID || 'g6K7ctVjfY2ssDGaUYHTFZTmD',
    // clientSecret: process.env.TWITTER_SECRET || '7Q5lnV2tSRG3ZYEZsFFIYlqVek7IJARhN76aZyRTmeCKohXmIO',
    // callbackURL:  baseUrl + 'auth/twitter/callback'

    clientID:     process.env.TWITTER_ID || 'gcSqXze6lyyyomv2j9dlUGI61',
    clientSecret: process.env.TWITTER_SECRET || 'EPLNQE9OjevhCHK1Nw0cAwM3evtsSLrm0nUEo9yQit53Z0AmcP',
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
  },

  weather: '248a4c6336acbc3b8738d521ab7de09d',
};
