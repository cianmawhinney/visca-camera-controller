const util = require('util');
const config = require('./config.js');

/*

Essentially, all of the code in this module starts off being given a json
object, and then works towards returning a buffer of bytes which some other
module can decide what to do with it

Currently, this file does not cover all VISCA commands
It includes:
* Pan and tilt
* zoom
* Presets

*/


function Pan_tiltDrive(command_object) {
  /*

  Pan and Tilt VISCA Reference
  ============================

  | Direction | VISCA Command              |
  | --------- | -------------------------- |
  | Up        | 8x 01 06 01 VV WW 03 01 FF |
  | Down      | 8x 01 06 01 VV WW 03 02 FF |
  | Left      | 8x 01 06 01 VV WW 01 03 FF |
  | Right     | 8x 01 06 01 VV WW 02 03 FF |
  | Upleft    | 8x 01 06 01 VV WW 01 01 FF |
  | Upright   | 8x 01 06 01 VV WW 02 01 FF |
  | DownLeft  | 8x 01 06 01 VV WW 01 02 FF |
  | DownRight | 8x 01 06 01 VV WW 02 02 FF |
  | Stop      | 8x 01 06 01 VV WW 03 03 FF |

  Where:
  * x is the camera visca address (0x0 - 0x7)
  * VV is the pan speed from 0-24 in hexadecimal (0x00 - 0x18)
  * WW is the tilt speed from 0-20 in hexadecimal (0x00 - 0x14)

  */

  let command_shell = "8%s 01 06 01 %s %s %s %s FF";
  let direction_lookup = {
    "up": "01",
    "down": "02",
    "left": "01",
    "right": "02"
  };

  let camera_id = command_object['camera'];
  let camera_address = config.getCameraConfig(camera_id)['visca_address'];

  // above is not implemented yet, so for now just use camera id
  // let camera_address = command_object['camera'];

  let pan = command_object['action']['data']['pan'];
  let tilt = command_object['action']['data']['tilt'];
  let pan_direction = direction_lookup[pan];
  let tilt_direction = direction_lookup[tilt];
  let pan_speed = command_object['action']['data']['pan_speed'];
  let tilt_speed = command_object['action']['data']['tilt_speed'];

  if (pan_speed == 0) pan_direction = "03";
  if (tilt_speed == 0) tilt_direction = "03";

  let command = util.format(command_shell, camera_address, _toHex(pan_speed), _toHex(tilt_speed), pan_direction, tilt_direction);
  return _createBuffer(command)
}

function CAM_Zoom(command_object) {
  /*

  Zoom VISCA Reference
  ====================

  | Direction       | VISCA Command     |
  | --------------- | ----------------- |
  | Stop            | 8x 01 04 07 00 FF |
  | Tele (Zoom in)  | 8x 01 04 07 2p FF |
  | Wide (Zoom out) | 8x 01 04 07 3p FF |

  Where:
  * x is the camera visca address (0x0 - 0x7)
  * p is the zoom speed (0x0 - 0x7)

  */

  let command_shell = "8%s 01 04 07 %s%s FF";
  let direction_lookup = {
    "zoomstop": "0",
    "zoomin": "2",
    "zoomout": "3"
  }

  let camera_id = command_object['camera'];
  let camera_address = config.getCameraConfig(camera_id)['visca_address'];

  let zoom = command_object['action']['data']['zoomDirection'];
  let zoom_direction = direction_lookup[zoom];
  let zoom_speed = command_object['action']['data']['zoomSpeed'];

  let command = util.format(command_shell, camera_address, zoom_direction, zoom_speed);
  return _createBuffer(command)
}

function CAM_Memory(command_object) {
  /*

  Presets VISCA Reference
  =======================

  | Function | VISCA Command        |
  | -------- | -------------------- |
  | Reset    | 8x 01 04 3F 00 pp FF |
  | Set      | 8x 01 04 3F 01 pp FF |
  | Recall   | 8x 01 04 3F 02 pp FF |

  Where:
  * x is the camera visca address (0x0 - 0x7)
  * pp is the preset number from 0 to 127 (0x0 - 0x7F)

  Note: In official VISCA, the preset number is a single hex digit, hence
  limiting the number of presets to 16. In this case, a '0' is prepended.

  */

  let command_shell = "8%s 01 04 3F %s %s FF";
  let function_lookup = {
    "reset": "0",
    "set": "1",
    "recall": "2"
  }

  let camera_id = command_object['camera'];
  let camera_address = config.getCameraConfig(camera_id)['visca_address'];

  let preset_function_string = command_object['action']['data']['function'];
  let preset_function = function_lookup[preset_function_string];
  let preset_number = command_object['action']['data']['preset_number'];

  let command = util.format(command_shell, camera_address, _toHex(preset_function), _toHex(preset_number));
  return _createBuffer(command)

}

function interpretCommand(binary_data) {
  // TODO: Implement function
  console.warn("visca.interpretCommand is not implemented yet.");
  return binary_data
}

function _toHex(i) {
  hexString = i.toString(16);
  if (hexString.length % 2) {
    hexString = '0' + hexString;
  }
  return hexString;
}

function _createBuffer(command) {
  stringCommand = command.toLowerCase().replace(/\s/g, ""); // ensure command is in correct form
  return new Buffer.from(stringCommand, 'hex')
}

module.exports = {
  Pan_tiltDrive,
  CAM_Zoom,
  CAM_Memory
}



/*
  * move ✔
  * zoom
  * focus
    -> this is an absolute value



  * home <-- maybe find a good place to put this; with presets?
*/
