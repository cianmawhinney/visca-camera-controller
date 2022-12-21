'use strict';

const path = require('path');
const express = require('express');
const app = express();

const { Liquid } = require('liquidjs');
const engine = new Liquid();

// add ws method to app
require('express-ws')(app);


class WebInput {

  constructor(cameras, port) {
    this.cameras = cameras;
    this.port = port;
  }

  listen() {
    app.ws('/', (ws) => {
      ws.on('message', async msg => {
        let data = JSON.parse(msg);
        let camera = this.cameras.find(({id}) =>
          id.toString() === data.cameraId.toString());

        if (camera === undefined) {
          ws.send('error: invalid camera requested');
          return;
        }

        let action = data.action;
        let argArray = [];

        // TODO: properly sanitize inputs
        switch (action.type.toLowerCase()) {
          case 'move': {
            let panSpeed = action.parameters.panSpeed || 0;
            let tiltSpeed = action.parameters.tiltSpeed || 0;
            argArray = [panSpeed, tiltSpeed];
            break;
          }
          
          case 'zoom': {
            let zoomSpeed = action.parameters.zoomSpeed || 0;
            argArray = [zoomSpeed];
            break;
          }

          case 'preset': {
            let presetNumber = action.parameters.presetNumber || 0;
            let presetFunction = action.parameters.function || 'recall';
            argArray = [presetNumber, presetFunction];
            break;
          }

          default:
            console.log('error: invalid function');
            break;

        }

        if (typeof camera[action.type] === 'function') {
          await camera[action.type].apply(camera, argArray)
            .then(() => ws.send('ack'))
            .catch((err) => console.log(err));
        } else {
          console.log('error: invalid action requested');
        }
      });
    });

    app.engine('liquid', engine.express());

    app.use(express.static(path.join(__dirname + '/web')));

    // TODO: implement settings API

    app.listen(this.port);
  }

}


module.exports = WebInput;
