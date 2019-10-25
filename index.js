'use strict';

const web = require('./webIn').app;
const config = require('./config');
const tcp = require('./tcpOut'); // temporary

tcp.connectAllCameras();

// other input methods should be started from here
web.listen(config.get('webserver_port'));
