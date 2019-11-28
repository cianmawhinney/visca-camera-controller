'use strict';

const web = require('./webIn').app;
const config = require('./config');
const tcpOut = require('./tcpOut'); // temporary
const gamepadControl = require('./gamepadIn');

tcpOut.connectAllCameras();

// input methods should be started from here
web.listen(config.get('webserver_port'));
gamepadControl.connect();
