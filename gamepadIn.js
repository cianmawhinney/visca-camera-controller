'use strict';

const GamePad = require('node-gamepad');
const visca = require('./visca');
const config = require('./config');
const tcpOut = require('./tcpOut');


const MAX_JOYSTICK_MOVEMENT = 128;
const JOYSTICK_POSITION_AT_REST = 128;

// TODO: Is there a more meaningful name for this?
// It is the distance from the centre of the joystick that the camer should
// start moving after
const AT_REST_MOVEMENT = 7;

// TODO: share current selected camera with frontend
//  - for now hold it separately
let currentCamera = 1;

// TODO: Specify controller in config
// TODO: Only allow connection if it's plugged in
// TODO: Allow the controller to be initialised from outside this file
let controller = new GamePad('microsoft/sidewinder-precision-2');


// TODO: Prevent error when unavailable camera selected
// TODO: Check vMix tally
// TODO: Should a camera be selected during a movement, send the stop
//       command to the previous camera

// TODO: Refactor this
controller.on('1:press', function() {
  currentCamera = 1;
  console.log('button 1 pressed');
});
controller.on('2:press', function() {
  currentCamera = 2;
  console.log('button 2 pressed');
});
controller.on('3:press', function() {
  currentCamera = 3;
  console.log('button 3 pressed');
});
controller.on('4:press', function() {
  console.log('button 4 pressed');
});
controller.on('5:press', function() {
  console.log('button 5 pressed');
});
controller.on('6:press', function() {
  console.log('button 6 pressed');
});
controller.on('7:press', function() {
  console.log('button 7 pressed');
});
controller.on('8:press', function() {
  console.log('button 8 pressed');
});

//  PAN/TILT
let previousMoveData = {};
controller.on('center:move', function(joystickPosition, data) {
  // default movement is nothing (ie. stop moving)
  let moveData = {
    pan: null,
    tilt: null,
    pan_speed: 0,
    tilt_speed: 0,
  };

  // x/y range is 0 to 255 - centre 128
  // We will ignore joystick movement until AT_REST_MOVEMENT value is reached

  // find direction up/down/left/right
  // TODO: option to reverse in configuration
  if (joystickPosition.x < JOYSTICK_POSITION_AT_REST) {
    moveData.pan = 'left';
  }
  if (joystickPosition.x > JOYSTICK_POSITION_AT_REST) {
    moveData.pan = 'right';
  }
  if (joystickPosition.y < JOYSTICK_POSITION_AT_REST) {
    moveData.tilt = 'up';
  }
  if (joystickPosition.y > JOYSTICK_POSITION_AT_REST) {
    moveData.tilt = 'down';
  }

  // Normalise x and y so that they are an integer between 0 and visca max speed
  // PAN SPEED
  let speedH = Math.abs(MAX_JOYSTICK_MOVEMENT - joystickPosition.x);
  if (speedH >= AT_REST_MOVEMENT) {
    moveData.pan_speed = Math.floor(
      ((speedH - AT_REST_MOVEMENT) /
      (MAX_JOYSTICK_MOVEMENT - AT_REST_MOVEMENT)) * visca.PAN_MAX_SPEED
    );
  }

  // TILT SPEED
  let speedV = Math.abs(MAX_JOYSTICK_MOVEMENT - joystickPosition.y);
  if (speedV >= AT_REST_MOVEMENT){
    moveData.tilt_speed = Math.floor(
      ((speedV - AT_REST_MOVEMENT) /
      (MAX_JOYSTICK_MOVEMENT - AT_REST_MOVEMENT)) * visca.TILT_MAX_SPEED
    );
  }

  // only send new position to camera if it represents a different value
  if (JSON.stringify(moveData) !== JSON.stringify(previousMoveData)) {
    try {
      let visca_address = config.getCameraByID(currentCamera).visca_address;
      let buffer = visca.genBuffer.move(visca_address, moveData);
      tcpOut.sendCommand(currentCamera, buffer);
    } catch (err) {
      console.log(err);
    }
  };
  previousMoveData = moveData;
});

//  ZOOM
let previousZoomData = {};
controller.on('jaw:move', function(jawPosition, data) {
  // default zoom parameters are nothing (ie. stop zooming)
  let zoomData = {
    zoomDirection: 'zoomstop',
    zoomSpeed: 0,
  };

  // jawPosition.x range is 0 to 255 - centre 128
  if (jawPosition.x < JOYSTICK_POSITION_AT_REST) {
    zoomData.zoomDirection = 'zoomout';
  }
  if (jawPosition.x > JOYSTICK_POSITION_AT_REST) {
    zoomData.zoomDirection = 'zoomin';
  }
  // normalise the speed so that it is between 0 and the maximum speed

  let speedZ = Math.abs(MAX_JOYSTICK_MOVEMENT - jawPosition.x);
  if (speedZ >= AT_REST_MOVEMENT) {
    zoomData.zoomSpeed = Math.floor(
      (speedZ - AT_REST_MOVEMENT) /
      (MAX_JOYSTICK_MOVEMENT - AT_REST_MOVEMENT) * visca.ZOOM_MAX_SPEED
    );
  }

  // only send new position to camera if it represents a different value
  if (JSON.stringify(zoomData) !== JSON.stringify(previousZoomData)) {
    try {
      let visca_address = config.getCameraByID(currentCamera).visca_address;
      let buffer = visca.genBuffer.zoom(visca_address, zoomData);
      tcpOut.sendCommand(currentCamera, buffer);
    } catch (err) {
      console.log(err);
    }
  }
  previousZoomData = zoomData;
});

module.exports = controller;
