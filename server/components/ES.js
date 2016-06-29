//all document see here https://github.com/elastic/elasticsearch-js
import cbToPromise from 'cb-to-promise';
import elasticsearch from 'elasticsearch';
/*var client = null;
if (config.ES.provider === 'aws') {
  client = elasticsearch.Client({
    hosts: config.ES.hosts,
    connectionClass: require('http-aws-es'),
    amazonES: {
      region: config.ES.region,
      accessKey: config.ES.accessKeyId || config.AWS.accessKeyId,
      secretKey: config.ES.secretAccessKey || config.AWS.secretAccessKey
    }
  });
} else {
  client = elasticsearch.Client({hosts: config.ES.hosts});
}*/
class ElasticSearch {
  constructor(options) {
    this.options = options || {};
    this.client = new elasticsearch.Client(options);
  }

  createIndice(name, settings) {
    settings = settings || {};
    return cbToPromise(this.client.indices.create)({ index: name, body: settings });
  }

  deleteInice(name) {
    return cbToPromise(this.client.indices.delete)({ index: name });
  }

  putMapping (index, options) {
    options = options || {};
    return cbToPromise(this.client.indices.putMapping)({ index: index, type: options.type, body: options.mapping });
  }
  
  update(index, options) {
    options = options || {};
    return cbToPromise(this.client.update)({ index: index, type: options.type, id: options.id, body: options.data });
  }
  
  delete(index, options) {
    options = options || {};
    return cbToPromise(this.client.delete)({ index: index, type: options.type, id: options.id });
  }
  
  search(index, query) {
    return cbToPromise(this.client.search)({index: index, body: query});
  }
}

module.exports = ElasticSearch;