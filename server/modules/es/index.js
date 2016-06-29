'use strict';
import ES from './../../components/ES';
import async from 'async';
import Mapping from './mapping';

class HealthStarsES {
	constructor(config, mapping) {
		this.config = config;
		this.mapping = mapping;
		this.indexName = config.index;
		this.options = config.options;
		this.settings = { settings: config.settings };
		this.es = new ES(this.options);
		this.init();
	}

	init(initCb) {
		async.series([
			(cb) => {
				this.es.exists(this.indexName, (err, exists) => {
					if(err) {
						return cb(err);
					}
					if(exists) {
						return cb(`ES module: Indice ${this.indexName} already exists`);
					}
					return cb(null);
				});
			},

			(cb) => {
				this.es.createIndice(this.indexName, this.settings, cb);
			},

			(cb) => {
				let funcs = [];
				let pushMapping = (type, mapping) => {
					return (cb) => {
						return this.es.putMapping(this.indexName, { type: type, mapping: mapping}, cb);
					}
				}

				for(let key in this.mapping) {
					funcs.push(pushMapping(key, this.mapping[key]));
				}
				async.parallel(funcs, cb);
			}
		], (err, done) => {
			if(err) {
				return console.log(err);
			}
		});
	}

	create(params, cb) {
		return this.es.create(this.indexName, {
			type: params.type,
			id: params.id,
			data: params.data 
		}, cb);
	}

	update(params, cb) {
		return this.es.update(this.indexName, {
			type: params.type,
			id: params.id,
			data: params.data 
		}, cb);
	}

	delete(params, cb) {
		return this.es.update(this.indexName, {
			type: params.type,
			id: params.id,
		}, cb);
	}

	search(query, type, cb) {
		return this.es.search(this.indexName, query, type, (err, result) => {
			if(err) return cb(err);
			return cb(null, this.populate(result));
		});
	}

	populate(result) {
    return {
      totalItem: result.hits.total,
      items: result.hits.hits.map( hit => {
        return hit._source;
      })
    };
  }
}

exports.config = {
	ES: {
		options: {
			host: 'localhost:9200'
		},
		index: 'health-stars',
		settings: {
			//put setting here
		},
		events: {
			CREATE : 'es_create_data',
			UPDATE : 'es_update_data',
			REMOVE: 'es_remove_data'
		},
		// put mapping type here and update mapping in ./mapping.js
		mapping: {
			userType: 'user',
			eventType: 'event',
			commentType: 'comment'
		}
	}
}

exports.core = (kernel) => {
	let m = new Mapping(kernel.config.ES);
	kernel.ES = new HealthStarsES(kernel.config.ES, m.mapping);

	/**
	* create new document
	* ex: kernel.queue.create(kernel.config.ES.events.CREATE, {type: 'user', id: 'objectId', data: 'object attributes').save();
	*/
	kernel.queue.process(kernel.config.ES.events.CREATE, (job, done) => {
		kernel.ES.create(job.data, err => {
			if(err) console.log(err);
			done();
		});
	});

	/**
	* update document to elastic-search
	* ex: kernel.queue.create(kernel.config.ES.events.UPDATE, {type: 'user', id: 'objectId', data: 'object attributes').save();
	*/
	kernel.queue.process(kernel.config.ES.events.UPDATE, (job, done) => {
		kernel.ES.update(job.data, err => {
			if(err) console.log(err);
			done();
		});
	});

	/**
	* Remove document from elastic-search
	* ex: kernel.queue.create(kernel.config.ES.events.REMOVE, {type: kernel.config.ES.mapping.userType, id: 'objectId'}).save();
	*/
	kernel.queue.process(kernel.config.ES.events.REMOVE, (job, done) => {
		kernel.ES.delete(job.data, err => {
			if(err) console.log(err);
			done();
		});
	});

	/**
	* example for search user type, to search all, using null instead of kernel.config.ES.mapping.userType
	*	kernel.ES.search({
	*		query: {
	*			match_all: {}
	*		}
	*	}, kernel.config.ES.mapping.userType, (err, result) => {
	*		console.log(err);
	*		console.log(result);
	*	});
	*/
};