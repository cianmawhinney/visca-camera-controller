/* eslint-env browser */
'use strict';

// create websocket connection to server
var websocketConnected = false;
var wsConnection = new WebSocket('ws://' + window.location.host + '/');

wsConnection.onopen = function(event) {
  websocketConnected = true;
};

// TODO: automatically reconnect on disconnect


/* ##########################
# Currently selected camera #
########################## */

var currentCamera = null;
var cameraSelectors = document.getElementsByClassName('camera-selector');

for (var i = 0; i < cameraSelectors.length; i++) {
  cameraSelectors[i].addEventListener('click', function(eventData) {
    currentCamera = eventData.toElement.value;
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
    pan: null,
    tilt: null,
    pan_speed: 0,
    tilt_speed: 0,
  };

  sendCommand(currentCamera, 'move', p);
});

function parseJoystickMovement(moveData) {
  if (!moveData.hasOwnProperty('direction')) {
    return;
  } else {
    var directionH = moveData.direction.x;
    var directionV = moveData.direction.y;
  }
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

  var speedH = Math.abs(Math.round(
    // joystick has a max distance of 120, visca pan speed has max 24
    smoothSpeed(moveData.distance) * Math.cos(moveData.angle.radian) * PAN_MAX_SPEED
  ));
  var speedV = Math.abs(Math.round(
    // joystick has a max distance of 120, visca tilt speed has max 20
    smoothSpeed(moveData.distance) * Math.sin(moveData.angle.radian) * TILT_MAX_SPEED
  ));

  return {
    pan: directionH,
    tilt: directionV,
    pan_speed: speedH,
    tilt_speed: speedV,
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
  var zoomDirection = '';
  if (sliderValue < 0) {
    zoomDirection = 'zoomin';
  } else if (sliderValue > 0) {
    zoomDirection = 'zoomout';
  } else {
    zoomDirection = 'zoomstop';
  }

  var zoomSpeed = Math.abs(Math.round(sliderValue));

  return {
    zoomDirection: zoomDirection,
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
    var presetID = eventData.toElement.dataset.presetId;

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

  wsConnection.send(JSON.stringify(payload));
}
