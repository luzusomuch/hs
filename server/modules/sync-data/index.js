'use strict';
import async from 'async';
import _ from 'lodash';
import KernelFactory from './../../kernel';
import es from './../../modules/es';
import Mapping from './../../modules/es/mapping';

let config = require('./../../config/environment');
let kernel = new KernelFactory(config);
let m = new Mapping(es.config.ES);
kernel.ES = new es.HealthStarsES(es.config.ES, m.mapping);


kernel.loadModule(require('./../../modules/event'));
kernel.loadModule(require('./../../modules/award'));
kernel.loadModule(require('./../../modules/user'));
kernel.compose();
kernel.ES.index((err) => {
		if(err) {
		  console.log('Error: '+ err);
		  // process.exit(0);
		  // return;
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
			},
			(cb) => {
				// implement these standard awards
				kernel.model.User.findOne({role: 'admin'}).then(user => {
					if (!user) {
						return cb();
					}
					let awards = [
						{objectName: 'Foodstar Point', ownerId: user._id, type: 'accepted'},
						{objectName: 'Sportstar Point', ownerId: user._id, type: 'accepted'},
						{objectName: 'Socialstar Point', ownerId: user._id, type: 'accepted'},
						{objectName: 'Actionstar Point', ownerId: user._id, type: 'accepted'},
						{objectName: 'Ecostar Point', ownerId: user._id, type: 'accepted'},
					];
					let awardName = _.map(awards, 'objectName');
					kernel.model.Award.remove({objectName: {$in: awardName}}, (err, data) => {
						if (err) {
							return cb(err);
						}
						console.log('removed old awards which in awards name list success');
						console.log(awards);
						async.each(awards, (award, callback) => {
							kernel.model.Award(award).save().then(success => {
								console.log('saved award ' + award.objectName);
								callback(null, award);
							}).catch(err => {
								console.log(err);
								callback(err);
							});
						}, cb);
					});
				}).catch(cb);
			}
		], () => {
			console.log("SYNC DATA DONE");
			process.exit(0);
		});
});