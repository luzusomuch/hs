'use strict';
import async from 'async';
import kernel from '../../app';

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
	});