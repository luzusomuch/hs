# mean-app

## Getting Started

#install git
sudo apt-get update
sudo apt-get install -y git

#install nodejs and npm
sudo apt-get install nodejs
sudo apt install nodejs-legacy
sudo apt-get install npm

#install mongodb
https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04

#install redis
https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-redis-on-ubuntu-16-04

#install Nginx
sudo apt-get install nginx -y

#install pm2
sudo npm install pm2 -g

#install Ruby
sudo apt-get install ruby-full

### Run ./elasticsearch.sh 1.7 to install elasticsearch which specific version 1.7
##Then start elasticsearch service by 
sudo service elasticsearch restart

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


## Testing

Running `npm test` will run the unit tests with karma.

#Adding 2dsphere Indexes by
open use mongo cmd then switch to use currently database
after that type 
db.users.createIndex({location: "2dsphere"})
db.events.createIndex({location: "2dsphere"})

#jquery 2.1.4 version is required
#bootstrap 3.3.7 is required

#For Lee's server please use these following cmds:
export baseUrl=http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com/
export socketUrl=http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com:9000/
export HOST='127.0.0.1'

#For real server
export baseUrl=https://healthstars.eu/
export socketUrl=https://healthstars.eu/

##Migrate simple data
if the server is running please stop it by pm2 stop healthstars
export NODE_ENV=production
cd to dist
node server\migrate.js
node server\syncData.js
back to root then run ./build.sh


##Running server
Please use ./build.sh to run our server.

#### Setup cron tabs 
sudo crontab -e

###run job every 4 hours for backup DB will be run at our DB server instance
0 */4 * * * sudo chmod +x /home/ubuntu/healthstars-backend/mongodb_backup.sh && /bin/sh /home/ubuntu/healthstars-backend/mongodb_backup.sh

###run job every 1 hour for create repeating events (only need to run in 1 instance not both)
0 */1 * * * export NODE_ENV=production && node /home/ubuntu/healthstars-backend/server/cron.js > /tmp/out.log 2> /tmp/err.log


####Nginx config
Please read nginx-config.txt file then copy the content of it to /etc/nginx/sites-available/default
After config nginx please restart nginx service

### For config max upload file size please read here https://easyengine.io/tutorials/php/increase-file-upload-size-limit/



####For DB server
We need mongodb, redis, elasticsearch
Open port 27017, 6379, 9200 by IPTABLE
You need to bind IP to 0.0.0.0 for redis https://redis.io/topics/security
You need to bind IP to 0.0.0.0 for mongodb http://stackoverflow.com/questions/34963522/unable-to-connect-to-mongo-on-remote-server
Set timezone by using sudo timedatectl set-timezone Europe/Berlin

#### For websites
We have 2 websites running the same time, so once update code we need rebuild code for them
35.157.152.138
35.157.36.144