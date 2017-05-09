'use strict';
import async from 'async';
import _ from 'lodash';
import KernelFactory from './../../kernel';
import es from './../../modules/es';
import Mapping from './../../modules/es/mapping';

let config = require('./../../config/environment');
console.log(config);
let kernel = new KernelFactory(config);
let m = new Mapping(es.config.ES);
kernel.ES = new es.HealthStarsES(es.config.ES, m.mapping);

kernel.loadModule(require('./../../modules/event'));
kernel.loadModule(require('./../../modules/user'));
kernel.loadModule(require('./../../modules/like'));
kernel.loadModule(require('./../../modules/invitation-request'));
kernel.loadModule(require('./../../modules/feed'));
kernel.compose();
async.parallel([
	(cb) => {
		require('./processEvent')(kernel, cb);
	},
	(cb) => {
		require('./processNewPost')(kernel, cb);
	}
], () => {
	console.log('done!');
  setTimeout(() => {
    process.exit();
  }, 10 * 60 * 1000);
});