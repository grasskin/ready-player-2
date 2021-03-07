const express = require('express');
const ip = require('ip');
const http = require("http"); // http server core module
const path = require("path");
const firebase = require('firebase');

const port = process.env.PORT || 3000;

// Set process name
process.title = "networked-aframe-server";

// Setup and configure Express http server.
const app = express();
app.use(express.static("public"));

// Set the configuration for our app
var config = {
    apiKey: "AIzaSyAfopjXcnaZQd0L5wBKj9FvOwtuJZC2VB4",
    authDomain: "openvr-306822.firebaseapp.com",
  
    
    databaseURL: "https://openvr-306822-default-rtdb.firebaseio.com",
    storageBucket: "openvr-306822.appspot.com"
  };
firebase.initializeApp(config);
  
  // Get a reference to the database service
var database = firebase.database();


// Serve the example and build the bundle in development.
if (process.env.NODE_ENV === "development") {
  const webpackMiddleware = require("webpack-dev-middleware");
  const webpack = require("webpack");
  const config = require("../webpack.dev");

  app.use(
    webpackMiddleware(webpack(config), {
      publicPath: "/dist/"
    })
  );
}

// Start Express http server
const webServer = http.createServer(app);
const io = require("socket.io")(webServer);

const rooms = {};

io.on("connection", socket => {
  console.log("user connected", socket.id);

  let curRoom = null;

  socket.on("joinRoom", data => {
    const { room } = data;

    if (!rooms[room]) {
      rooms[room] = {
        name: room,
        occupants: {},
      };
    }

    const joinedTime = Date.now();
    rooms[room].occupants[socket.id] = joinedTime;
    curRoom = room;

    console.log(`${socket.id} joined room ${room}`);
    socket.join(room);

    socket.emit("connectSuccess", { joinedTime });
    const occupants = rooms[room].occupants;
    io.in(curRoom).emit("occupantsChanged", { occupants });
  });

  socket.on("send", data => {
    io.to(data.to).emit("send", data);
  });

  socket.on("broadcast", data => {
    socket.to(curRoom).broadcast.emit("broadcast", data);
  });

  socket.on("disconnect", () => {
    console.log('disconnected: ', socket.id, curRoom);
    if (rooms[curRoom]) {
      console.log("user disconnected", socket.id);

      delete rooms[curRoom].occupants[socket.id];
      const occupants = rooms[curRoom].occupants;
      socket.to(curRoom).broadcast.emit("occupantsChanged", { occupants });

      if (occupants == {}) {
        console.log("everybody left room");
        delete rooms[curRoom];
      }
    }
  });
});

webServer.listen(port, () => {
    const ipAddress = ip.address();
    console.log(`Network access via: ${ipAddress}:${port}`);
    console.log("listening on http://localhost:" + port);
});
