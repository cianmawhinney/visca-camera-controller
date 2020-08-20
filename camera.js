'use strict';

const helpers = require('./helperFunctions');
const RequestQueue = require('./requestQueue');
const util = require('util');
const assert = require('assert');
const stream = require('stream');
const net = require('net');

class ViscaCamera {

  /**
   * @constant {number} PAN_MAX_SPEED Maximum visca pan speed
   */
  static get PAN_MAX_SPEED() {
    return 24;
  };

  /**
   * @constant {number} TILT_MAX_SPEED Maximum visca tilt speed
   */
  static get TILT_MAX_SPEED() {
    return 20;
  }

  /**
   * @constant {number} ZOOM_MAX_SPEED Maximum visca zoom speed
   */
  static get ZOOM_MAX_SPEED() {
    return 7;
  }

  /**
   * @constant {number} OCP_MAX_ID On camera preset maximum ID
   */
  static get OCP_MAX_ID() {
    return 15;
  }

  /**
   * @constant {number} OCP_MIN_ID On camera preset minimum ID
   */
  static get OCP_MIN_ID() {
    return 0;
  }

  /**
   * @constructor
   * @param {object} options
   * @param {number} options.viscaAddress VISCA address of camera
   * @param {number} [options.id] Unique identifier for this camera
   * @param {string} [options.friendlyName] A memorable name for the camera
   * @param {string} [options.host] IP address for camera
   * @param {number} [options.port] TCP port for camera
   * @param {stream.Duplex} [options.connection] A pre-made connection to use
   * instead of supplying a host and port combination
   */
  constructor(options) {
    assert(options.viscaAddress,
      'You must specify a VISCA address');

    assert((options.host && options.host) || options.connection,
      'You must specify a host and port, or pass in a connection.');

    this.viscaAddress = options.viscaAddress;

    this.id = options.id;

    this.friendlyName = options.friendlyName;

    if (!options.connection) {
      this.connection = new net.Socket();

      const connect = () => {
        try {
          console.log('Connecting to camera: ' + this);
          this.connection.connect({
            host: options.host,
            port: options.port,
          });
        } catch (e) {
          console.error(e.toString());
        }
      };

      connect();

      this.connection.on('close', () => {
        console.log('Connection reset, reconnecting...');
        connect();
      });

      this.connection.on('timeout', () => {
        console.log('Connection timed out, reconnecting...');
        connect();
      });

    } else {
      assert(options.connection instanceof stream.Duplex,
        'options.connection must be of type stream.Duplex');
      this.connection = options.connection();
    }

    this.queue = new RequestQueue();
  }

  /**
   * Returns a string representation of this current camera
   */
  toString() {
    let identifier;
    if (this.friendlyName) {
      identifier = `"${this.friendlyName}"`;
    } else {
      identifier = `VISCA address=${this.viscaAddress}`;
    }
    return `[ViscaCamera ${identifier}]`;
  }

  /**
   * Pans and/or tilts the camera
   * @param {number} panSpeed must be an integer between +/- 24
   * @param {number} tiltSpeed must be an integer between +/- 20
   */
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
    return await this.send(payload, 'move');
  }

  /**
   * Zooms the camera in or out
   * @param {number} zoomSpeed must be an integer between +/- 7
   */
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
    return await this.send(payload, 'zoom');
  }

  /**
   * Performs an action relating to the specified on camera preset
   * @param {number} presetID must be an integer between 0 and 15
   * @param {PresetActions} action Operation to be carried out
   */
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
    return await this.send(payload, 'onCameraPreset');
  }

  /**
   * Sets the specified on camera preset
   * @param {number} presetID must be an integer between 0 and 15
   */
  async setOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'set');
  }

  /**
   * Recalls the specified on camera preset
   * @param {number} presetID must be an integer between 0 and 15
   */
  async recallOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'recall');
  }

  /**
   * Clears the specified on camera preset
   * @param {number} presetID must be an integer between 0 and 15
   */
  async clearOnCameraPreset(presetID) {
    return await this.onCameraPreset(presetID, 'clear');
  }

  /**
   * @typedef {('set' | 'recall' | 'clear')} PresetActions Valid preset actions
   */

  /**
   * Performs an action relating to a preset position.
   * Extends the functionality of {@link onCameraPreset} by moving the camera
   * directly to stored positions to act as presets
   * @param {number} presetID must be an integer between 0 and 15
   * @param {PresetActions} action Operation to be carried out to the preset
   * @todo Implement function and stored presets
   */
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

  /**
   * @typedef {('on' | 'off' | 'back' | 'ok')} MenuActions Valid menu actions
   */

  /**
   * Performs an action relating to the navigation of the OSD menu
   * @param {MenuActions} action Operation to be carried out to the menu
   */
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

  /**
   * Toggles the OSD menu
   */
  async menuToggle() {
    let isMenuShowing;
    try {
      isMenuShowing = await this.isMenuShowing();
    } catch (error) {
      // rethrow to have error handled by input method
      throw error;
    }
    if (!isMenuShowing) {
      // menu is off, so turn it on
      return await this.menu('on');
    } else {
      // menu is on, so turn it off
      return await this.menu('off');
    }
  }

  /**
   * Queries the camera for whether the OSD menu is showing
   * @returns {boolean}
   */
  async isMenuShowing() {
    let command = util.format('8%s 09 06 06 FF', this.viscaAddress);
    let payload = helpers.createBufferFromString(command);
    let response;
    try {
      response = await this.send(payload);
    } catch (error) {
      throw new Error('Failed to get menu status');
    }
    // response code should be in 3rd byte
    return (response[2] === 0x03);
  }

  /**
   * Properly schedules and sends a command to the camera
   * @param {Buffer} payload Command to send to the camera
   * @param {string} commandCategory Identifier of what type of command is to be
   * sent
   */
  async send(payload, commandCategory) {
    let job = () => this._send(payload);
    job.commandCategory = commandCategory;
    return await this.queue.addJob(job);
  }

  /**
   * Internal method to send commands to the camera
   * @param {Buffer} payload binary payload to be sent to the camera
   * @private
   */
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

        if (!ViscaCamera.isReplyFromCamera(response)) {
          reject(new Error('Invalid reply from camera'));
        } else if (ViscaCamera.isErrorMessage(response)) {
          reject(ViscaCamera.interpretErrorMessage(response));
        } else {
          resolve(response);
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

  /**
   * Returns true if buffer is a visca reply from a camera
   * @param {Buffer} buffer Buffer to test
   * @static
   */
  static isReplyFromCamera(buffer) {
    let message = buffer.toString('hex');
    // each byte is now represented by two hex characters
    // should start with visca address + 8, and end with ff
    let responseFromCamera = /^[9a-f].*[ff]$/g;
    return responseFromCamera.test(message);
  }

  /**
   * Returns true if buffer is a visca error message from a camera
   * @param {Buffer} buffer Visca reply from camera
   * @static
   */
  static isErrorMessage(buffer) {
    let message = buffer.toString('hex');
    // each byte is now represented by two hex characters
    // only error messages will have a 6 in the 3rd character position
    let errorMessageTest = /^.{2}[6].{5}$/g;
    return (this.isReplyFromCamera(buffer) && errorMessageTest.test(message));
  }

  /**
   * Returns the meaning of a visca error message
   * @param {Buffer} buffer Visca reply from camera
   * @static
   */
  static interpretErrorMessage(buffer) {
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
        regex: /^.*$/g, // fallback, will match anything
      },
    ];

    return errors.find((error) => error.regex.test(message)).meaning;
  }
}

module.exports = ViscaCamera;
