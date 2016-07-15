'use strict';

import express from 'express';
import session from 'express-session';
import http from 'http';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import path from 'path';

exports.name = 'kernel-app';

exports.config = {
  PUBLIC_PATHS: [
    path.resolve('./client')
  ]
};

// Expose app
exports.core = (kernel) => {
  kernel.app = express();
  kernel.app.use(morgan('dev'));
  kernel.app.use(compression());
  kernel.app.use(bodyParser.urlencoded({ extended: false }));
  kernel.app.use(bodyParser.json());
  kernel.app.use(methodOverride());
  kernel.app.use(cookieParser());

  kernel.app.use(session({
    secret: kernel.config.SECRETS.session,
    saveUninitialized: false,
    resave: false
  }));

  // Add headers
  kernel.app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  });


  //public folders
  let publicFolders = typeof kernel.config.PUBLIC_PATHS === 'string' ? [kernel.config.PUBLIC_PATHS] : kernel.config.PUBLIC_PATHS;
  kernel.config.PUBLIC_PATHS.forEach(folderPath => {
    kernel.app.use(express.static(folderPath));
  });
  //TODO - support https
  kernel.httpServer = http.createServer(kernel.app);
};
