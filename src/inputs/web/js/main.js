/* eslint-env browser */
/* global joystick, slider */
'use strict';

// create websocket connection to server
var ws; // will be instantiated in connect method below
var websocketConnected = false;

// setup taken from https://stackoverflow.com/a/23176223
var wsReconnectTimeout = 250;

function connect() {
  ws = new WebSocket('ws://' + window.location.host + '/');
  ws.onopen = function(event) {
    console.log('Websocket connected!');
    websocketConnected = true;
    wsReconnectTimeout = 250; // reset reconnect timer on connection
  };

  ws.onclose = function(e) {
    console.log('Socket closed: ', e.reason);
    console.log('Reconnect will be attempted in',
      wsReconnectTimeout / 1000, 'seconds');
    setTimeout(connect, wsReconnectTimeout += wsReconnectTimeout);
  };

  ws.onerror = function(err) {
    console.error('Websocket encountered error: ', err.message);
    console.log('Will attempt to reconnect...');
    ws.close();
  };

}

connect();


/* ##########################
# Currently selected camera #
########################## */

var currentCamera = null;
var cameraSelectors = document.getElementsByClassName('camera-selector');

for (var i = 0; i < cameraSelectors.length; i++) {
  cameraSelectors[i].addEventListener('click', function(eventData) {
    currentCamera = eventData.target.value;
  });
}
// TODO: when a camera is selected, update the currently shown presets
// TODO: when a camera is selected, update the current camera in the backend too
// TODO: If the camera is changed in the backend then update in the front-end too


/* ###############
# Joystick stuff #
############### */


var p_last = {};
joystick.on('move', function(e, data) {

  // TODO: find better variable names than 'p' and 'p_last'
  var p = parseJoystickMovement(data);
  if (p === undefined) {
    return;
  }

  // only send new position if it represents a different value
  if (JSON.stringify(p) !== JSON.stringify(p_last)) {
    sendCommand(currentCamera, 'move', p);
  }
  p_last = p;
});

joystick.on('end', function(e, data) {
  var p = {
    panSpeed: 0,
    tiltSpeed: 0,
  };

  sendCommand(currentCamera, 'move', p);
});

function parseJoystickMovement(moveData) {
  /*
  if (!moveData.hasOwnProperty('direction')) {
    return;
  } else {
    var directionH = moveData.direction.x;
    var directionV = moveData.direction.y;
  }
  */
  // TODO: currently this gets to fast too quickly
  function smoothSpeed(distance) {
    let distanceOffset = 20; // distance of movement before activating
    if (distance < distanceOffset) {
      return 0;
    }
    let speed = (distance - distanceOffset) / (120 - distanceOffset);
    return speed;
  }

  const PAN_MAX_SPEED = 24;
  const TILT_MAX_SPEED = 20;

  var speedH = Math.round(
    // joystick has a max distance of 120, visca pan speed has max 24
    smoothSpeed(moveData.distance) * Math.cos(moveData.angle.radian) * PAN_MAX_SPEED);
  var speedV = Math.round(
    // joystick has a max distance of 120, visca tilt speed has max 20
    smoothSpeed(moveData.distance) * Math.sin(moveData.angle.radian) * TILT_MAX_SPEED);

  return {
    panSpeed: speedH,
    tiltSpeed: speedV,
  };
}


/* ##################
# Zoom slider stuff #
################## */

var z_last = {};
slider.noUiSlider.on('update', function(values) {
  var sliderValue = values[0]; // Only one slider handle

  // TODO: find better variable names than 'z' and 'z_last'
  var z = parseSliderMovement(sliderValue);
  if (JSON.stringify(z) !== JSON.stringify(z_last)) {
    sendCommand(currentCamera, 'zoom', z);
  }
  z_last = z;
});

function parseSliderMovement(sliderValue) {
  /*
  var zoomDirection = '';
  if (sliderValue < 0) {
    zoomDirection = 'zoomin';
  } else if (sliderValue > 0) {
    zoomDirection = 'zoomout';
  } else {
    zoomDirection = 'zoomstop';
  }
  */
  var zoomSpeed = Math.round(sliderValue);

  return {
    // zoomDirection: zoomDirection,
    zoomSpeed: zoomSpeed,
  };
}


/* #####################
# Preset buttons stuff #
##################### */

/*
The end goal for these buttons is to have each preset which has a *usable*
position stored be _able_ to be given a friendly name.
When the button is held in, this should give the functionality to rename the
preset, edit the position, or delete it (the data and the name)
*/

// when buttons are clicked on, send the command to the backend
var presetButtons = document.getElementsByClassName('presets-button');
for (let i = 0; i < presetButtons.length; i++) {
  presetButtons[i].addEventListener('click', function(eventData) {
    var presetID = eventData.target.dataset.presetId;

    // TODO: find a better name for variable x
    var x = {
      function: 'recall',
      preset_number: presetID,
    };
    sendCommand(currentCamera, 'preset', x);
  });
}


/* ############
# Other stuff #
############ */

function sendCommand(cameraID, actionType, data = null) {
  if (websocketConnected === false || cameraID == null) {
    return;
  }

  var payload = {
    cameraId: cameraID,
    action: {
      type: actionType,
      parameters: data,
    },
  };

  ws.send(JSON.stringify(payload));
}
