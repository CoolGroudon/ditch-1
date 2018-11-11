//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//

//Requiring the http and path libraries
var http = require('http');
var path = require('path');


//requiring the async, socket.io, and express libraries
var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

//Hey router, use the client that you find at the given location to render the client side application
router.use(express.static(path.resolve(__dirname, 'client')));

//An array to hold the messages when they get sent
var messages = [];

//An array to hold each socket (person that is connected)
var sockets = [];

//Event handler - runs on 'connection'
io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });
    //add the new connection to the sockets array
    sockets.push(socket);

    //take the socket out of the list of sockets, and update the roster on the client end updateRoster
    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    //when someone sends a message...
    socket.on('message', function (msg) {
      var text = String(msg || '');    //either, make the message into a string or, use an empty string


      if (!text)   //if there's no text, stop doing this, because there's nothing to store
        return;

      //Use the 'name' info on the active socket, then build a data payload
      socket.get('name', function (err, name) {  
        var data = {
          name: name,
          text: text
        };

        //send that data payload as a 'message' object 
        broadcast('message', data);
        
        //throw those messages into the array
        messages.push(data);
      });
    });


    //When a connection is made, identify connection by name
    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });


//update the roster so they can be seen on the clients
function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
