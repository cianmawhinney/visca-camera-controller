'use strict';

const Joystick = require('joystick');

class JoystickInput {
  constructor(cameras, joystickID) {
    this.cameras = cameras;
    this.id = joystickID;

    // keep track of the currently selected camera
    this.currentCamera;
  }

  listen() {
    // suggested values of 3500, 350 for deadzone and sensitivity
    const joystick = new Joystick(this.id, 3500, 350);

    joystick.on('axis', (event) => {
      // need to map out the joystick with regards to the linux API
      console.log(event);
    });
  }

}

module.exports = JoystickInput;
