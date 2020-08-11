'use strict';

const ViscaCamera = require('../camera');
const Joystick = require('joystick');

/*
Beware: Hard coded values ahead!
This file has been set up for my specific use case, for specific hardware!

Eventually the goal is to have a generalised way of setting up any joystick,
but now is not that time
*/

class JoystickInput {

  // constants
  static get AXIS_MAX() {
    return 32768; // signed 16 bit integer
  }

  constructor(cameras, joystickID) {
    this.cameras = cameras;
    this.id = joystickID;

    // keep track of the currently selected camera
    /** @type {ViscaCamera} */
    this.currentCamera;

    // pan and tilt must be sent to the camera together, so keep track of them
    // the toggle slider state for the buttons must also be stored
    this.state = {
      pan: 0,
      tilt: 0,
      zoom: 0,
      buttonToggle: '',
    };
  }

  listen() {
    const deadzone = 1000;
    const sensitivity = 100;
    const joystick = new Joystick(this.id, deadzone, sensitivity);

    joystick.on('axis', async event => {
      /*
        event.time:   an integer representing the 'time' the event triggered
        event.value:  a number between +/- 2^15
        event.number: the id of the axis
        event.init:   a boolean of whether the event shows the initial
                      state of the joystick
      */

      if (this.currentCamera === undefined) return;

      switch (event.number) {
        // main stick horizontal
        case 0: {
          // this axis controls panning

          let normalisedPan = event.value / JoystickInput.AXIS_MAX;
          normalisedPan = normalisedPan ** 3; // start panning slower
          let pan = Math.round(normalisedPan * ViscaCamera.PAN_MAX_SPEED);

          if (pan !== this.state.pan) {
            this.state.pan = pan;
            await this.currentCamera.move(this.state.pan, this.state.tilt)
              .catch((error) => console.log('error: ' + error));
          }

          break;
        }

        // main stick vertical
        case 1: {
          // this axis controls tilting

          let normalisedTilt = event.value / JoystickInput.AXIS_MAX;
          normalisedTilt = normalisedTilt ** 3; // start tilting slower
          normalisedTilt = -normalisedTilt; // reverse direction
          let tilt = Math.round(normalisedTilt * ViscaCamera.TILT_MAX_SPEED);

          if (tilt !== this.state.tilt) {
            this.state.tilt = tilt;
            await this.currentCamera.move(this.state.pan, this.state.tilt)
              .catch((error) => console.log('error: ' + error));
          }

          break;
        }

        // main stick rotation
        case 2: {
          // this axis controls zooming

          let normalisedZoom = event.value / JoystickInput.AXIS_MAX;
          normalisedZoom = normalisedZoom ** 3; // start zooming slower
          let zoom = Math.round(normalisedZoom * ViscaCamera.ZOOM_MAX_SPEED);

          if (zoom !== this.state.zoom) {
            this.state.zoom = zoom;
            await this.currentCamera.zoom(this.state.zoom)
              .catch((error) => console.log('error: ' + error));
          }

          break;
        }

        // front slider
        case 3: {
          // this axis chooses whether the buttons activate a camera or a preset

          if (JoystickInput.AXIS_MAX)
            this.state.buttonToggle = 'camera';
          if (-JoystickInput.AXIS_MAX)
            this.state.buttonToggle = 'preset';

          break;
        }

        // 'nipple' joystick horizontal
        case 4: {
          // this axis acts as ok and back buttons for the OSD menu

          if (this.currentCamera.isMenuShowing()) {
            if (event.value === JoystickInput.AXIS_MAX) {
              await this.currentCamera.menu('ok');
            } else if (event.value === -JoystickInput.AXIS_MAX) {
              await this.currentCamera.menu('back');
            }
          }

          break;
        }

        // 'nipple' joystick vertical
        case 5: {
          // this axis acts as up and down buttons for the OSD menu

          if (this.currentCamera.isMenuShowing()) {
            if (event.value === JoystickInput.AXIS_MAX) {
              // move up in menu by
              await this.currentCamera.move(0, 1);
            } else if (event.value === -JoystickInput.AXIS_MAX) {
              await this.currentCamera.menu('back');
            }
          }

          break;
        }
      }
    });

    joystick.on('button', async event => {
      // trigger on press of the button, as long as it isn't the initial state
      if (!event.init && event.value === 1) {
        console.log(`Button #${event.number} pressed!`);

        switch (event.number) {

          // 'fire' button
          case 0: {
            // toggles the menu on and off
            if (this.currentCamera === undefined) return;
            await this.currentCamera.menuToggle()
              .catch((error) => console.log(error));
            break;
          }

          // top center button
          case 1: {
            // sends 'ok' in menu
            if (this.currentCamera === undefined) return;
            await this.currentCamera.menu('ok')
              .catch((error) => console.log(error));
            break;
          }

          // top left button
          case 2: {
            break;
          }

          // top right button
          case 3: {
            break;
          }

          // left panel, back left
          case 4: {
            // sets current camera to camera 1
            this.currentCamera = this.cameras.find(({id}) => id === 1);
            break;
          }

          // left panel, back center
          case 5: {
            // sets current camera to camera 2
            this.currentCamera = this.cameras.find(({id}) => id === 2);
            break;
          }

          // left panel, back right
          case 6: {
            // sets current camera to camera 3
            this.currentCamera = this.cameras.find(({id}) => id === 3);
            break;
          }

          // left panel, front left
          case 9: {
            // sets current camera to camera 4
            this.currentCamera = this.cameras.find(({id}) => id === 4);
            break;
          }

          // left panel, front center
          case 8: {
            // sets current camera to camera 5
            this.currentCamera = this.cameras.find(({id}) => id === 5);
            break;
          }

          // left panel, front right
          case 7: {
            // sets current camera to camera 6
            this.currentCamera = this.cameras.find(({id}) => id === 6);
            break;
          }

          default: {
            console.log('Preset buttons not set up yet');
          }
        }
      }
    });
  }

}

module.exports = JoystickInput;
