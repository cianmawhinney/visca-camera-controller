// create websocket connection to server
var websocketConnected = false;
var wsConnection = new WebSocket("ws://" + window.location.host + "/");

wsConnection.onopen = function(event) {
  websocketConnected = true;
}

// TODO: automatically reconnect on disconnect


/* ##########################
# Currently selected camera #
########################## */

var currentCamera = null
var cameraSelectors = document.getElementsByClassName('camera-selector');

for (var i = 0; i < cameraSelectors.length; i++) {
  cameraSelectors[i].addEventListener('click', function(eventData) {
    currentCamera = eventData.toElement.value;
  });
}
// TODO: when a camera is selected, update the currently shown presets


/* ###############
# Joystick stuff #
############### */

var p_last = {};
joystick.on("move", function(e, data) {

  // TODO: find better variable names than 'p' and 'p_last'
  var p = parseJoystickMovement(data);
  if (p === undefined) return

  // only send new joystick location if it has moved enough to affect visca output
  if (JSON.stringify(p) != JSON.stringify(p_last)) {
    sendCommand(currentCamera, "move", p);
  }
  p_last = p;
})

joystick.on("end", function(e, data) {
  // TODO: this feels hacky, maybe find another way?
  p = {
    pan: null,
    tilt: null,
    pan_speed: 0,
    tilt_speed: 0
  }

  sendCommand(currentCamera, "move", p)
})

function parseJoystickMovement(moveData) {
  if (!moveData.hasOwnProperty("direction")) {
    return
  }
  else {
    directionH = moveData.direction.x;
    directionV = moveData.direction.y;
  }
  speedH = Math.abs(Math.round(moveData.distance / 5 * Math.cos(moveData.angle.radian)));
  speedV = Math.abs(Math.round(moveData.distance / 6 * Math.sin(moveData.angle.radian)));

  return {
    pan: directionH,
    tilt: directionV,
    pan_speed: speedH,
    tilt_speed: speedV
  };
}


/* ##################
# Zoom slider stuff #
################## */

var z_last = {}
slider.noUiSlider.on("update", function(values) {
  sliderValue = values[0]; // Only one slider handle

  // TODO: find better variable names than 'z' and 'z_last'
  var z = parseSliderMovement(sliderValue);
  if (JSON.stringify(z) != JSON.stringify(z_last)) {
    sendCommand(currentCamera, "zoom", z);
  }
  z_last = z;
})

function parseSliderMovement(sliderValue) {
  var zoomDirection = "";
  if (sliderValue < 0) {
    zoomDirection = "zoomin";
  } else if (sliderValue > 0) {
    zoomDirection = "zoomout";
  } else {
    zoomDirection = "zoomstop";
  }

  var zoomSpeed =  Math.abs(Math.round(sliderValue));

  return {
    zoomDirection: zoomDirection,
    zoomSpeed: zoomSpeed
  }
}


/* #####################
# Preset buttons stuff #
##################### */

/*
The end goal for these buttons is to have each preset which has a *usable* position stored be _able_ to be given a friendly name
When the button is held in, this should give the functionality to rename the preset, edit the position, or delete it (the data and the name)
*/

// when buttons are clicked on, send the command to the backend
presetButtons = document.getElementsByClassName("presets-button");
for (let i=0; i < presetButtons.length; i++) {
  presetButtons[i].addEventListener("click", function(eventData) {
    presetID = eventData.toElement.dataset.presetId;

    // TODO: find a better name for variable x
    x = {
      function: "recall",
      preset_number: presetID
    }
    sendCommand(currentCamera, "preset", x)
  })
}



/* ############
# Other stuff #
############ */

function sendCommand(cameraID, actionType, data=null) {
  if (websocketConnected == false) return
  if (cameraID == null) return

  var payload = {
    camera: cameraID,
    action: {
      type: actionType,
      data: data
    }
  }

  wsConnection.send(JSON.stringify(payload));
}
