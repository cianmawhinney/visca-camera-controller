'use strict';

const config = require('./config');
const WebInput = require('./inputs/web');
const SerialInput = require('./inputs/serial');
const JoystickInput = require('./inputs/joystick');
const ViscaCamera = require('./camera');

console.log('System starting');

let cameras = [];
// connect to cameras
config.get('cameras').forEach((camera) => {
  const options = {
    viscaAddress: camera.visca_address,
    id: camera.id,
    friendlyName: camera.friendlyName,
    host: camera.connection.parameters.host,
    port: camera.connection.parameters.port,
  };
  cameras.push(new ViscaCamera(options));
});

if (config.get('webserver_port') !== config.default('webserver_port')) {
  const web = new WebInput(cameras, config.get('webserver_port'));
  web.listen();
  console.log('Web server started');
}

if (config.get('serial_port') !== config.default('serial_port')) {
  const serial = new SerialInput(cameras, config.get('serial_port'));
  serial.listen();
  console.log('Listening for serial joystick');
}

if (config.get('joystick_id') !== config.default('joystick_id')) {
  const joystick = new JoystickInput(cameras, config.get('joystick_id'));
  joystick.listen();
  console.log('Listening for gamepad joystick');
}

// FIXME: make this line actually work
process.on('beforeExit', () => console.log('System exiting...'));
