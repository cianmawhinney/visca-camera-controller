'use strict';

const helpers = require('../helperFunctions');
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');


// 1. read in serial data (delimiting it along the way)
// 2. look at visca address in data stream
// 3. decide what camera the command is intended for
// 4. send the command on to the intended camera
// 5. wait for a response from the camera
// 6. send that response back to the serial joystick

class SerialInput {

  constructor(cameras, path) {
    this.cameras = cameras;
    this.port = new SerialPort(path);
  }

  listen() {
    // every visca command ends with hex FF
    const viscaDelimiter = helpers.createBufferFromString('ff');
    const delimiterOptions = {
      delimiter: viscaDelimiter,
      includeDelimiter: true,
    };
    const delim = new Delimiter(delimiterOptions);
    this.port.pipe(delim);

    delim.on('data', (data) => {
      // visca address is contained in the least significant
      // 4 bits of the first byte
      let viscaAddress = data[0] & 0x0F;
      let camera = this.cameras.find((c) => c.viscaAddress === viscaAddress);
      camera._send(data)
        .then((response) => this.port.write(response))
        .catch((err) => console.log('error ' + err));
    });
  }

}


module.exports = SerialInput;
