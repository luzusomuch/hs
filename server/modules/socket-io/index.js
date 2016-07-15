/**
 * Socket.io configuration
 */
'use strict';

import redisSocket from 'socket.io-redis';
import _ from 'lodash';
import {EventBus} from './../../components';
let onlineUsers = [];

// When the user disconnects.. perform this
function onDisconnect(socket) {
  console.info('[%s] DISCONNECTED', socket.address);
  if (socket.userId) {
    _.remove(onlineUsers, function(item){
      return item === socket.userId.toString();
    });
    onlineUsers.forEach(user => {
      EventBus.emit('socket:emit', {
        event: 'tracking:user',
        room: user,
        data: onlineUsers
      });
    });
  }
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', data => {
    socket.log(JSON.stringify(data, null, 2));
  });

  // Insert sockets below
  socket.on('join', id => {
    console.log('user join room [%s] socket id [%s]', id, socket.id);
    socket.userId = id;
    socket.join(id);

    onlineUsers.push(id);
    // get uniq id
    onlineUsers = _.uniq(onlineUsers);

    onlineUsers.forEach(userId => {
      EventBus.emit('socket:emit', {
        event: 'tracking:user',
        room: userId,
        data: onlineUsers
      });
    });
  });
}

exports.core = (kernel) => {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));
  var socketio = require('socket.io')(kernel.httpServer, {
    //TODO - load from env, in production we dont need to serve client
    serveClient: true,
    path: '/socket.io-client'
  });
  socketio.adapter(redisSocket(kernel.config.REDIS));

  socketio.on('connection', function(socket) {
    socket.address = socket.request.connection.remoteAddress +
      ':' + socket.request.connection.remotePort;

    socket.connectedAt = new Date();

    socket.log = function(...data) {
      console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
    };

    // Call onDisconnect.
    socket.on('disconnect', () => {
      onDisconnect(socket);
      socket.log('DISCONNECTED');
    });

    // Call onConnect.
    onConnect(socket);
    socket.log('CONNECTED');
  });

  EventBus.on('socket:emit',function(payload) {
    if (!payload.event) {
      return;
    }
    if (payload.room) {
      socketio.sockets.in(payload.room).emit(payload.event, payload.data);
    } else {
      socketio.sockets.emit(payload.event, payload.data);
    }
  })
};
