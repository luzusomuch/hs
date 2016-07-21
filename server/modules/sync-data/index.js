'use strict';
import async from 'async';
import KernelFactory from './../../kernel';
import es from './../../modules/es';
import Mapping from './../../modules/es/mapping';

let config = require('./../../config/environment');
let kernel = new KernelFactory(config);
let m = new Mapping(es.config.ES);
kernel.ES = new es.HealthStarsES(es.config.ES, m.mapping);


kernel.loadModule(require('./../../modules/event'));
kernel.compose();
kernel.ES.index((err) => {
		if(err) {
		  console.log(err);
		  process.exit(0);
		  return;
		}
		async.parallel([
			(cb) => {
				// sync event
				kernel.model.Event.find({}).then(events => {
					async.each(events, (event, callback) => {
						kernel.ES.create({
							type: kernel.ES.config.mapping.eventType, 
							id: event._id.toString(),
							data: event.toJSON()
						}, (err, result) => {
							if (err) {
								console.log(err);
							}
							callback()
						});
					}, cb);
				}).catch(cb);
			}
		], () => {
			console.log("SYNC DATA DONE");
			process.exit(0);
		});
});