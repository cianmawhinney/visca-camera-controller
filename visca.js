'use strict';

const util = require('util');
const config = require('./config.js'); // TODO: Remove config from this file

/*
The code in this file works toward returning a buffer containing the command
for the camera.

Currently, this file does not cover all VISCA commands
It includes:
* Pan and tilt
* zoom
* Presets

*/

const PAN_MAX_SPEED = 24;
const TILT_MAX_SPEED = 20;
const ZOOM_MAX_SPEED = 7;

// TODO: validate input

let genBuffer = {
  move: function(camera, parameters) {
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

    let command_shell = '8%s 01 06 01 %s %s %s %s FF';
    let direction_lookup = {
      up: '01',
      down: '02',
      left: '01',
      right: '02',
    };

    let camera_address = config.getCameraConfig(camera).visca_address;

    let pan_direction = direction_lookup[parameters.pan];
    let tilt_direction = direction_lookup[parameters.tilt];
    let pan_speed = parameters.pan_speed;
    let tilt_speed = parameters.tilt_speed;

    if (pan_speed === 0) {
      pan_direction = '03';
    }
    if (tilt_speed === 0) {
      tilt_direction = '03';
    }

    let command = util.format(
      command_shell,
      camera_address,
      _toHex(pan_speed),
      _toHex(tilt_speed),
      pan_direction,
      tilt_direction
    );
    return _createBuffer(command);
  },

  zoom: function(camera, parameters) {
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

    let command_shell = '8%s 01 04 07 %s%s FF';
    let direction_lookup = {
      zoomstop: '0',
      zoomin: '2',
      zoomout: '3',
    };

    let camera_address = config.getCameraConfig(camera).visca_address;

    let zoom_direction = direction_lookup[parameters.zoomDirection];
    let zoom_speed = parameters.zoomSpeed;

    let command = util.format(
      command_shell,
      camera_address,
      zoom_direction,
      zoom_speed
    );

    return _createBuffer(command);
  },

  preset: function(camera, parameters) {
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

    let command_shell = '8%s 01 04 3F %s %s FF';
    let function_lookup = {
      reset: '0',
      set: '1',
      recall: '2',
    };

    let camera_address = config.getCameraConfig(camera).visca_address;

    let preset_function_value = function_lookup[parameters.function];
    let preset_number = parameters.preset_number;

    let command = util.format(
      command_shell,
      camera_address,
      _toHex(preset_function_value),
      _toHex(preset_number)
    );

    return _createBuffer(command);
  },
};

function _toHex(i) {
  let hexString = i.toString(16);
  if ((hexString.length % 2) !== 0) {
    hexString = '0' + hexString;
  }
  return hexString;
}

function _createBuffer(command) {
  // convert to lowercase and remove whitespace
  let stringCommand = command.toLowerCase().replace(/\s/g, '');
  // eslint-disable-next-line new-cap
  return new Buffer.from(stringCommand, 'hex');
}

module.exports = {
  PAN_MAX_SPEED,
  TILT_MAX_SPEED,
  ZOOM_MAX_SPEED,
  genBuffer,
};
