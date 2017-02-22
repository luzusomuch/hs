# mean-app

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and npm](nodejs.org) Node ^4.2.3, npm ^2.14.7
- [Bower](bower.io) (`npm install --global bower`)
- [Ruby](https://www.ruby-lang.org) and then `gem install sass`
- [Gulp](http://gulpjs.com/) (`npm install --global gulp`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`
- [Elasticsearch](https://www.elasticsearch.com/) - version 1.7 - run elasticsearch
- [GraphicMagick](http://www.graphicsmagick.org/) - keep in the path - sudo apt-get install graphicsmagick

### Developing

1. Run `npm install` to install server dependencies.

2. Run `bower install` to install front-end dependencies.

3. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running

4. Run `gulp serve` to start the development server. It should automatically open the client in your browser when ready.

## Build & development

Run `grunt build` for building and `grunt serve` for preview.

## Testing

Running `npm test` will run the unit tests with karma.

#Adding 2dsphere Indexes by
open use mongo cmd then switch to use currently database
after that type 
db.users.createIndex({location: "2dsphere"})
db.events.createIndex({location: "2dsphere"})

#jquery 2.1.4 version is required

#For Lee's server please use these following cmds:
export baseUrl=http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com/
export socketUrl=http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com:9000/

##Running server
Please use ./build.sh to run our server.
