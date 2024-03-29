'use strict';

import KernelFactory from './kernel';
import path from 'path';

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('./config/environment');
let kernel = new KernelFactory(config);

//load custom module
kernel.loadModule(require('./modules/mailer'));
kernel.loadModule(require('./modules/socket-io'));
kernel.loadModule(require('./modules/user'));
kernel.loadModule(require('./modules/lang'));
kernel.loadModule(require('./modules/award'));
kernel.loadModule(require('./modules/photo'));
kernel.loadModule(require('./modules/report'));
kernel.loadModule(require('./modules/thread'));
kernel.loadModule(require('./modules/invitation-request'));
kernel.loadModule(require('./modules/category'));
kernel.loadModule(require('./modules/device-token'));
kernel.loadModule(require('./modules/event'));
kernel.loadModule(require('./modules/relation'));
kernel.loadModule(require('./modules/auth'));
kernel.loadModule(require('./modules/es'));
kernel.loadModule(require('./modules/queues'));
kernel.loadModule(require('./modules/feed'));
kernel.loadModule(require('./modules/grant-award'));
kernel.loadModule(require('./modules/like'));
kernel.loadModule(require('./modules/comment'));
kernel.loadModule(require('./modules/share'));
kernel.loadModule(require('./modules/about'));
kernel.loadModule(require('./modules/attend-event'));
kernel.loadModule(require('./modules/company-account-request'));
kernel.loadModule(require('./modules/country'));
kernel.loadModule(require('./modules/notification'));
//compose then start server
kernel.compose();

//custom app path
//TODO - can move to kernel?
// All undefined asset or api routes should return a 404
kernel.app.route('/:url(api|auth|components|bower_components|app|assets|lib|styles)/*')
 .get((req, res) => { res.status(404).send('Not found!'); });

// All other routes should redirect to the index.html
kernel.app.route('/*')
  .get((req, res) => {
    if(/^\/backend.*/.test(req.url)) {
    	return res.sendFile(path.resolve('client/backend.html'));
    }
    return res.sendFile(path.resolve('client/index.html'));
  });

kernel.startHttpServer();

// Expose kernel
exports = module.exports = kernel;