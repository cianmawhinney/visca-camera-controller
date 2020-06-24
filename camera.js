'use strict';

const helpers = require('./helperFunctions');
const RequestQueue = require('./requestQueue');
const util = require('util');
const assert = require('assert');
const stream = require('stream');

class ViscaCamera {

  // constants
  static get PAN_MAX_SPEED() {
    return 24;
  };
  static get TILT_MAX_SPEED() {
    return 20;
  }
  static get ZOOM_MAX_SPEED() {
    return 7;
  }
  static get OCP_MAX_ID() {
    // on camera preset
    return 15;
  }
  static get OCP_MIN_ID() {
    // on camera preset
    return 0;
  }

  constructor(id, friendlyName, viscaAddress, connection) {
    assert(id !== undefined,
      'The system ID for the camera must be passed to the ViscaCamera object');
    this.id = id;

    this.friendlyName = (friendlyName !== undefined) ? friendlyName : this.id;

    this.viscaAddress = (viscaAddress !== undefined) ? viscaAddress : 1;

    assert((connection instanceof stream.Duplex),
      'A connection stream must be passed to the ViscaCamera object');
    this.connection = connection;

    this.queue = new RequestQueue({
      concurrency: 2,
      autostart: true,
    });
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
    panSpeed = helpers.constrain(panSpeed,
      -ViscaCamera.PAN_MAX_SPEED, ViscaCamera.PAN_MAX_SPEED);

    tiltSpeed = Math.round(tiltSpeed); // ensure tiltSpeed is an integer
    tiltSpeed = helpers.constrain(tiltSpeed,
      -ViscaCamera.TILT_MAX_SPEED, ViscaCamera.TILT_MAX_SPEED);

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
    return await this.send(payload);
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
    zoomSpeed = helpers.constrain(zoomSpeed,
      -ViscaCamera.ZOOM_MAX_SPEED, ViscaCamera.ZOOM_MAX_SPEED);

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
      Math.abs(zoomSpeed),
    );

    let payload = helpers.createBufferFromString(command);
    return await this.send(payload);
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

    let aboveMin = presetID >= ViscaCamera.OCP_MIN_ID;
    let belowMax = presetID <= ViscaCamera.OCP_MAX_ID;
    assert(aboveMin && belowMax,
      `The preset ID must be between ${ViscaCamera.OCP_MIN_ID}
      and ${ViscaCamera.OCP_MAX_ID}`);

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
    return await this.send(payload);
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

  async preset(presetID, action) {
    let aboveMin = presetID >= ViscaCamera.OCP_MIN_ID;
    let belowMax = presetID <= ViscaCamera.OCP_MAX_ID;
    if (aboveMin && belowMax) {
      return await this.onCameraPreset(presetID, action);
    } else {
      // TODO: implement system presets
      // return await this.systemPreset();
    }
  }

  async menu(action) {
    /*

    Menu VISCA Reference
    ====================

    | function | VISCA Command           |
    | -------- | ----------------------- |
    | on       | 8x 01 06 06 02 FF       |
    | off      | 8x 01 06 06 03 FF       |
    | back     | 8x 01 06 06 10 FF       |
    | ok       | 8x 01 7E 01 02 00 01 FF |

    Where:
    * x is the camera visca address (0x0 - 0x7)

    */

    action = action.toLowerCase();

    const actionLookup = {
      on: '8%s 01 06 06 02 FF',
      off: '8%s 01 06 06 03 FF',
      back: '8%s 01 06 06 10 FF',
      ok: '8%s 01 7E 01 02 00 01 FF',
    };

    assert(Object.keys(actionLookup).includes(action),
      'The passed action is not valid');

    let command = util.format(actionLookup[action], this.viscaAddress);

    let payload = helpers.createBufferFromString(command);
    return await this.send(payload);
  }

  // TODO: review this & remove call to console
  async menuToggle() {
    // ask camera whether the menu is showing
    let queryCommand = util.format('8%s 09 06 06 FF', this.viscaAddress);
    let queryPayload = helpers.createBufferFromString(queryCommand);
    let response = await this.send(queryPayload)
      .catch(() => console.error('Error: failed to get menu status'));
    // response code should be in 3rd byte
    if (response[2] === 0x03) {
      // menu is off, so turn it on
      return await this.menu('on');
    } else {
      // menu is on, so turn it off
      return await this.menu('off');
    }

  }

  async send(payload) {
    return await this.queue.addJob(() => this._send(payload));
  }

  async _send(payload) {
    this.connection.write(payload);

    // three outcomes of the response: data, error, timeout
    // these items need to cleared up, no matter the outcome
    // so when an outcome is reached, the items from the other two are cleared
    let onResponse;
    let onConnectionError;
    let timeoutId;

    const waitForResponse = new Promise((resolve, reject) => {
      onResponse = (response) => {
        // prevent memory leaks by removing unneeded listeners
        this.connection.removeListener('error', onConnectionError);
        clearTimeout(timeoutId);

        if (!this.isErrorMessage(response)) {
          resolve(response);
        } else {
          reject(this.interpretErrorMessage(response));
        }
      };

      onConnectionError = (error) => {
        // prevent memory leaks by removing unneeded listeners
        this.connection.removeListener('data', onResponse);
        clearTimeout(timeoutId);

        reject(error);
      };

      this.connection.once('data', onResponse);
      this.connection.once('error', onConnectionError);
    });

    const timeout = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        this.connection.removeListener('data', onResponse);
        this.connection.removeListener('error', onConnectionError);
        reject(new Error(`Request to camera id ${this.id} timed out`));
      }, 100); // 100ms
    });

    return Promise.race([waitForResponse, timeout]);
  }

  isReplyFromCamera(buffer) {
    let message = buffer.toString('hex');
    // each byte is now represented by two hex characters
    // should start with visca address + 8, and end with ff
    let responseFromCamera = /^[9a-f].*[ff]$/g;
    return responseFromCamera.test(message);
  }

  isErrorMessage(buffer) {
    let message = buffer.toString('hex');
    // each byte is now represented by two hex characters
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
