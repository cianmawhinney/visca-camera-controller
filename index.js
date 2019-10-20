'use strict';

const web = require('./webIn').app;
const config = require('./config').getConfiguration();
const tcp = require('./tcpOut'); // temporary

tcp.connectAllCameras();

// other input methods should be started from here
web.listen(config.webserver_port);
