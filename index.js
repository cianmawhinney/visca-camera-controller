const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const visca = require('./visca.js');
const config = require('./config.js').getConfiguration();
const cameraIO = require('./io_handler.js');

cameraIO.connectAllCameras();

app.use(express.static('frontend'))

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    let command_json = JSON.parse(msg);
    let camera_id = command_json['camera'];
    let action = command_json['action'];
    let action_type = action['type'];

    let visca_command;
    switch (action_type) {
      case "move":
        visca_command = visca.Pan_tiltDrive(command_json);
        cameraIO.sendCommand(camera_id, visca_command);
        break;

      case "zoom":
        visca_command = visca.CAM_Zoom(command_json);
        cameraIO.sendCommand(camera_id, visca_command);
        break;

      case "preset":
        visca_command = visca.CAM_Memory(command_json);
        cameraIO.sendCommand(camera_id, visca_command);
        break;

      default:
        console.log("This input probably just isn't implemented yet");
        break;
    }
  });
});

app.listen(config.webserver_port);
