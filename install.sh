#!/bin/sh

#git
sudo apt-get install -y git

#nodejs
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs

#mongo
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
#nginx
sudo apt-get update
sudo apt-get install nginx -y
sudo apt-get install redis-server -y
sudo apt-get install graphicsmagick -y
sudo apt-get install -y mongodb-org
sudo service mongod start

#post install
sudo npm install pm2 -g
sudo npm install gulp -g
sudo npm install grunt-cli -g
sudo npm install gulp-cli -g
sudo npm install grunt -g
sudo npm install bower -g