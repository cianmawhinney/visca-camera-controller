'use strict';

const config = require('./config');
const net = require('net');


let activeSessions = [];

function connectCamera(camera) {
  console.log('Connecting to camera #' + camera.id + '...');
  // createConnection can take an array containing 'host' and 'port'
  activeSessions[camera.id] = net.createConnection(camera);

  // print message when camera is successfully connected to
  // messages will not necessarily be in order due to asynchronous operation
  activeSessions[camera.id].on('connect', function() {
    console.log('Successfully connected to camera #' + camera.id + '!');
  });

  // print any received from a camera
  // TODO: interpret data in the visca converter
  activeSessions[camera.id].on('data', function(data) {
    console.log('Camera #' + camera.id + ': ' + data.toString('hex'));
  });

  // print any errors to the screen
  activeSessions[camera.id].on('error', function(err) {
    console.log('Error connecting to camera #' + camera.id + ' - ' + err);
  });
}

function connectAllCameras() {
  console.log('Begin connecting to cameras...');
  config.get('cameras').forEach(connectCamera);
}

function sendCommand(cameraID, binaryCommand) {
  activeSessions[cameraID].write(binaryCommand);
}

module.exports = {
  connectAllCameras,
  sendCommand,
};
