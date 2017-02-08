#!/bin/sh
#go parent and execute the script
#cd ..

#checkout source code
git fetch && git checkout develop
git checkout -f
git pull
#kill process
pm2 stop healthstars
#install dependencies
npm install
bower install --allow-root

#NODE_ENV production
export NODE_ENV=production
#build
gulp build

#go to /dist
cd dist

#TODO - run build command for production

#start app
pm2 start server/index.js --name="healthstars"
