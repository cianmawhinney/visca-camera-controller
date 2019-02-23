const config = require('./config.js');
const net = require('net');


let activeSessions = [];

function connectAllCameras(){
  console.log("Begin connecting to cameras...");
  for (let i=0; i < config.getCameras().length; i++) {
    let c = config.getCameras()[i]; // array of options for a specific camera

    console.log("Connecting to camera #" + c.id + "...");
    activeSessions[c.id] = net.createConnection(c); // createConnection takes an array containing 'host' and 'port', among other things

    // print message when camera is successfully connected to
    // these messages will not necessarily be in order due to asynchronous operation
    activeSessions[c.id].on("connect", function() {
      console.log("Successfully connected to camera #" + c.id + "!");
    });

    // what to data is received from a camera
    // in the future there will be a visca handler to interpret this.
    activeSessions[c.id].on("data", function(data) {
      console.log("Received data from camera #" + c.id + ": " + data);
    });

    // print any errors to the screen
    activeSessions[c.id].on("error", function(err) {
      console.log("Error connecting to camera #" + c.id + " - " + err);
    });
  }
}

function sendCommand(cameraID, binaryCommand) {
  activeSessions[cameraID].write(binaryCommand);
}

module.exports = {
  connectAllCameras,
  sendCommand
}
