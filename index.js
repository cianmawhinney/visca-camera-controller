'use strict';

const web = require('./webIn').app;
const config = require('./config');
const tcpOut = require('./tcpOut'); // temporary
const gamepad = require('./gamepad');
const visca = require('./visca')

tcpOut.connectAllCameras();

// TODO: share current selected camera with frontend - for now hold it separately
var controller = ( new gamepad( 'microsoft/sidewinder-precision-2' ) ).connect();
var currentCamera = 1;

const PAN_MAX_SPEED = 24;
const TILT_MAX_SPEED = 20;
const ZOOM_MAX_SPEED = 7;
const MAX_JS_MOVEMENT = 128;
const JS_AT_REST = 128;
const AT_REST_MOVEMENT = 7;

function sendCommand(cameraID, actionType, data = null) {
  if (cameraID == null) {
    return;
  }

  var payload = {
    cameraId: cameraID,
    action: {
      type: actionType,
      parameters: data,
    },
  };

  let parameters = payload.action.parameters;
  try {
    let visca_address = config.getCameraByID(cameraID).visca_address;
    let command = visca.genBuffer[actionType](visca_address, parameters);
    //  <io-handler thing>.send(command);
    tcpOut.sendCommand(cameraID, command);
  } catch (err) {
    console.log(err);
  }
}
// TODO: Prevent error when unavailable camera selected
// TODO: check vMix tally
controller.on( '1:press', function() {
  currentCamera = 1;
  console.log('button 1 pressed')
} );
controller.on( '2:press', function() {
  currentCamera = 2;
  console.log('button 2 pressed')
} );
controller.on( '3:press', function() {
  currentCamera = 3;
  console.log('button 3 pressed')
} );
controller.on( '4:press', function() {
  console.log('button 4 pressed')
} );
controller.on( '5:press', function() {
  console.log('button 5 pressed')
} );
controller.on( '6:press', function() {
  console.log('button 6 pressed')
} );
controller.on( '7:press', function() {
  console.log('button 7 pressed')
} );
controller.on( '8:press', function() {
  console.log('button 8 pressed')
} );
//  PAN/TILT
var p_last = {};
controller.on( 'center:move', function(e, data) {
  var directionV,directionH,speedV,speedH = 0;
  // x/y range is 0 to 255 - centre 128
  //console.log('joystick moved ' + e.x + ' ' + e.y)
  //We will ignore movement untill about 10 off centre

  // find direction up/down/left/right
  if (e.x <= MAX_JS_MOVEMENT) {
    directionV='up';
  } else {
    directionV='down';
  }
  if (e.y <= MAX_JS_MOVEMENT) {
    directionH='left';
  } else {
    directionH='right';
  }
  // normalise x and y so that they are an integer between 0 to visca max speed
  //PAN SPEED
  if (e.y <= MAX_JS_MOVEMENT){
    // need to reverse it
    speedH = (MAX_JS_MOVEMENT- e.y);
  } else {
    // subtract the left ragne 0 - 128
    speedH = (e.y - MAX_JS_MOVEMENT);
  }
  if (speedH <= AT_REST_MOVEMENT){
    speedH=0;
  } else {
    speedH = Math.floor((speedH - AT_REST_MOVEMENT)/(MAX_JS_MOVEMENT - AT_REST_MOVEMENT) * PAN_MAX_SPEED);
  }
  // TILT SPEED
  if (e.x <= MAX_JS_MOVEMENT){
    // need to reverse it
    speedV = (MAX_JS_MOVEMENT- e.x);
  } else {
    // subtract the left range 0 - 128
    speedV = (e.x - MAX_JS_MOVEMENT);
  }
  if (speedV <= AT_REST_MOVEMENT){
    speedV=0;
  } else {
    // get the speed to be relative the the maximum allowed 
    speedV = Math.floor((speedV - AT_REST_MOVEMENT)/(MAX_JS_MOVEMENT - AT_REST_MOVEMENT) * TILT_MAX_SPEED);
  }

  // send command
  if (speedV === 0 && speedH === 0){
  // send stop if centred
  var p = {
      pan: null,
      tilt: null,
      pan_speed: 0,
      tilt_speed: 0,
    };
 } else {
    var p = {
      pan: directionH,
      tilt: directionV,
      pan_speed: speedV,
      tilt_speed: speedH,
    };
    
  }
   // only send new position if it represents a different value
   if (JSON.stringify(p) !== JSON.stringify(p_last)) {
    //console.log(p);
    sendCommand(currentCamera, 'move', p);
   };
   p_last=p;
} );

//  ZOOM
var z_last = {};
controller.on( 'jaw:move', function(e, data) {
  // x range is 0 to 255 - centre 128
  //console.log(e);
  var zoomDirection = '';
  var zoomSpeed = 0;
  var speedZ = 0;
  if (e.x + AT_REST_MOVEMENT < JS_AT_REST) {
    zoomDirection = 'zoomout';
  } else if (e.x - AT_REST_MOVEMENT > JS_AT_REST) {
    zoomDirection = 'zoomin';
  } else {
    zoomDirection = 'zoomstop';
  }
  // normalise x so that it is an integer between 0 to visca max speed
  //PAN SPEED
  if (e.x <= MAX_JS_MOVEMENT){
    // need to reverse it
    speedZ = (MAX_JS_MOVEMENT- e.x);
  } else {
    // subtract the left ragne 0 - 128
    speedZ = (e.x - MAX_JS_MOVEMENT);
  }
  if (speedZ <= AT_REST_MOVEMENT){
    zoomSpeed=0;
  } else {
    // get the speed to be relative the the maximum allowed 
    zoomSpeed = Math.floor((speedZ - AT_REST_MOVEMENT)/(MAX_JS_MOVEMENT - AT_REST_MOVEMENT) * ZOOM_MAX_SPEED);
  }
  if (zoomSpeed === 0) {
    zoomDirection = 'zoomstop';
  }
  var z = {
    zoomDirection: zoomDirection,
    zoomSpeed: zoomSpeed,
  };
  // only send new position if it represents a different value
  if (JSON.stringify(z) !== JSON.stringify(z_last)) {
    //console.log(z);
    sendCommand(currentCamera, 'zoom', z);
  }
  z_last = z;

} );

// other input methods should be started from here
web.listen(config.get('webserver_port'));
