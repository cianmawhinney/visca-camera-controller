'use strict';

const Joi = require('@hapi/joi');
const express = require('express');
const app = express();
const expressWs = require('express-ws');
expressWs(app); // add ws method to app
const visca = require('./visca');
const config = require('./config');
const tcpOut = require('./tcpOut'); // temporary

app.use(express.static('web-frontend'));

// TODO: consistent naming for JSON parameters
const generalSchema = Joi.object({
  cameraId: Joi.number().integer().min(1).max(config.get('cameras').length),
  action: Joi.object({
    type: Joi.string().valid('move', 'zoom', 'preset'),
    parameters: Joi.object(),
  }),
});

app.ws('/', function(ws, req) {

  ws.on('message', function(msg) {
    const { error, value } = generalSchema.validate(JSON.parse(msg));
    if (error) {
      ws.send(error);
    } else {
      let actionType = value.action.type;
      let camera = value.cameraId;
      let parameters = value.action.parameters;
      try {
        let command = visca.genBuffer[actionType](camera, parameters);
        //  <io-handler thing>.send(command);
        tcpOut.sendCommand(camera, command);
      } catch (err) {
        ws.send('An error occurred, see server logs for details, for now');
        console.log(err);
      }
    }

  });

});


module.exports = {
  app,
};
