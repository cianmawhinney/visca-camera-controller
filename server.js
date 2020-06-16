'use strict';

const helpers = require('./helperFunctions');
const config = require('./config');
const WebInput = require('./inputs/web');
const SerialInput = require('./inputs/serial');
const JoystickInput = require('./inputs/joystick');
const Camera = require('./camera');

const SerialPort = require('@serialport/stream');
const Delimiter = require('@serialport/parser-delimiter');
const net = require('net');

console.log('System starting');

let cameras = [];
// connect to cameras
config.get('cameras').forEach((camera) => {
  let connection;
  if (camera.connection.type === 'serial') {
    const port = new SerialPort(camera.connection.parameters.serial_port);
    const viscaDelimiter = helpers.createBufferFromString('ff');
    connection = port.pipe(new Delimiter({delimiter: viscaDelimiter}));
  } else if (camera.connection.type === 'network') {
    connection = net.createConnection(camera.connection.parameters);
  } else {
    throw new Error('A valid connection type must be' +
      'specified for camera ID: ' + camera.id);
  }
  cameras.push(new Camera(
    camera.id,
    camera.friendly_name,
    camera.visca_address,
    connection));
});

if (config.get('webserver_port') !== 0) {
  const web = new WebInput(cameras, config.get('webserver_port'));
  web.listen();
  console.log('Web server started');
}

if (config.get('serial_port')) {
  const serial = new SerialInput(cameras, config.get('serial_port'));
  serial.listen();
  console.log('Listening for serial joystick');
}

if (config.get('joystick_id')) {
  const joystick = new JoystickInput(cameras, config.get('joystick_id'));
  joystick.listen();
  console.log('Listening for gamepad joystick');
}

// TODO: make this line actually work
process.on('beforeExit', () => console.log('System exiting...'));
