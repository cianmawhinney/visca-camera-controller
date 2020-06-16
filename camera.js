'use strict';

const helpers = require('./helperFunctions');
const util = require('util');
const assert = require('assert');
const stream = require('stream');

const PAN_MAX_SPEED = 24;
const TILT_MAX_SPEED = 20;
const ZOOM_MAX_SPEED = 7;
const OCP_MAX_ID = 15; // on camera preset
const OCP_MIN_ID = 0; // on camera preset


class ViscaCamera {

  constructor(id, friendlyName, viscaAddress, connection) {
    assert(id !== undefined,
      'The system ID for the camera must be passed to the ViscaCamera object');
    this.id = id;

    this.friendlyName = (friendlyName !== undefined) ? friendlyName : this.id;

    this.viscaAddress = (viscaAddress !== undefined) ? viscaAddress : 1;

    assert((connection instanceof stream.Duplex),
      'A connection stream must be passed to the ViscaCamera object');
    this.connection = connection;
  }

  async move(panSpeed, tiltSpeed) {
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

    panSpeed = Math.round(panSpeed); // ensure panSpeed is an integer
    panSpeed = helpers.constrain(panSpeed, -PAN_MAX_SPEED, PAN_MAX_SPEED);

    tiltSpeed = Math.round(tiltSpeed); // ensure tiltSpeed is an integer
    tiltSpeed = helpers.constrain(tiltSpeed, -TILT_MAX_SPEED, TILT_MAX_SPEED);

    let panDirection;
    if (panSpeed < 0) {
      // pan left
      panDirection = '01';
    } else if (panSpeed > 0) {
      // pan right
      panDirection = '02';
    } else {
      // stop panning
      panDirection = '03';
    }

    let tiltDirection;
    if (tiltSpeed < 0) {
      // tilt down
      tiltDirection = '01';
    } else if (tiltSpeed > 0) {
      // tilt up
      tiltDirection = '02';
    } else {
      // stop tilting
      tiltDirection = '03';
    }

    let command = util.format('8%s 01 06 01 %s %s %s %s FF',
      this.viscaAddress,
      helpers.toHex(Math.abs(panSpeed)),
      helpers.toHex(Math.abs(tiltSpeed)),
      panDirection,
      tiltDirection,
    );

    let payload = helpers.createBufferFromString(command);
    return await this._send(payload);
  }

  async zoom(zoomSpeed) {
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

    zoomSpeed = Math.round(zoomSpeed); // ensure zoomSpeed is an integer
    zoomSpeed = helpers.constrain(zoomSpeed, -ZOOM_MAX_SPEED, ZOOM_MAX_SPEED);

    let zoomDirection;
    if (zoomSpeed > 0) {
      // zoom in
      zoomDirection = '2';
    } else if (zoomSpeed < 0) {
      // zoom out
      zoomDirection = '3';
    } else {
      zoomDirection = '0';
    }

    let command = util.format('8%s 01 04 07 %s%s FF',
      this.viscaAddress,
      zoomDirection,
      zoomSpeed,
    );

    let payload = helpers.createBufferFromString(command);
    return await this._send(payload);
  }

  async onCameraPreset(presetID, action) {
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

    assert(presetID >= OCP_MIN_ID && presetID <= OCP_MAX_ID,
      `The preset ID must be between ${OCP_MIN_ID} and ${OCP_MAX_ID}`);

    action = action.toLowerCase();
    assert(action === 'set' || action === 'recall' || action === 'clear',
      'The action must be one of the following: set, recall, clear');

    let functionLookup = {
      clear: '0',
      set: '1',
      recall: '2',
    };

    let command = util.format('8%s 01 04 3F 0%s %s FF',
      this.viscaAddress,
      functionLookup[action],
      helpers.toHex(presetID),
    );

    let payload = helpers.createBufferFromString(command);
    return await this._send(payload);
  }

  async setOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'set');
  }

  async recallOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'recall');
  }

  async clearOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'clear');
  }

  async _send(payload) {
    this.connection.write(payload);
    return new Promise((resolve, reject) => {
      // listen for response
      this.connection.once('data', (response) => {
        if (!this.isErrorMessage(response)) {
          resolve(response);
        } else {
          reject(this.interpretErrorMessage(response));
        }
        // remove error event listener to prevent memory leak
        this.connection.removeListener('error', reject);
      });
      this.connection.once('error', reject);
    });
  }

  isReplyFromCamera(buffer) {
    let message = buffer.toString('hex');
    // should start with visca address + 8, and end with ff
    let responseFromCamera = /^[9a-f].*[ff]$/g;
    return responseFromCamera.test(message);
  }

  isErrorMessage(buffer) {
    let message = buffer.toString('hex');
    // only error messages will have a 6 in the 3rd character position
    let errorMessageTest = /^.{2}[6].{5}$/g;
    return (this.isReplyFromCamera(buffer) && errorMessageTest.test(message));
  }

  interpretErrorMessage(buffer) {
    let message = buffer.toString('hex');

    let errors = [
      {
        meaning: 'Message length error',
        regex: /^.{4}01.{2}$/g,
      },
      {
        meaning: 'Syntax Error',
        regex: /^.{4}02.{2}$/g,
      },
      {
        meaning: 'Command buffer full',
        regex: /^.{4}03.{2}$/g,
      },
      {
        meaning: 'Command cancelled',
        regex: /^.{4}04.{2}$/g,
      },
      {
        meaning: 'No socket (to be cancelled)',
        regex: /^.{4}05.{2}$/g,
      },
      {
        meaning: 'Command not executable',
        regex: /^.{4}41.{2}$/g,
      },
      {
        meaning: 'Unknown error message',
        regex: /^.*$/g,
      },
    ];

    return errors.find((error) => error.regex.test(message)).meaning;
  }
}

module.exports = ViscaCamera;
