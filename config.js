'use strict';

const minimist = require('minimist');
const convict = require('convict');
const convict_format_with_validator = require('convict-format-with-validator');

convict.addFormats(convict_format_with_validator);
convict.addFormats({

  'camera-array': {
    validate: function(cameras, schema) {
      if (!Array.isArray(cameras)) {
        throw new Error('cameras must be an array');
      }
      for (let camera of cameras) {
        convict(schema.camera).load(camera).validate();
      }
    },
  },

  // TODO: 'preset-array': {}

});

const config = convict({
  webserver_port: {
    doc: 'The port the web server will listen on',
    format: 'port',
    default: 0,
    env: 'PORT',
    arg: 'port',
  },
  serial_port: {
    doc: 'The serial port a serial joystick is connected to',
    format: String,
    default: '',
  },
  joystick_id: {
    doc: 'The id of a gamepad joystick eg. /dev/input/jsX',
    format: 'nat',
    default: undefined,
  },
  cameras: {
    doc: 'An array of cameras to control',
    format: 'camera-array',
    default: [],

    // a template for a camera within the array
    camera: {
      id: {
        doc: 'The id of the camera within the system',
        format: Number,
        default: null,
      },
      friendly_name: {
        doc: 'A recognisable name given to the camera',
        format: String,
        default: '',
      },
      visca_address: {
        doc: 'The visca address used by the camera',
        format: 'nat',
        default: 1,
      },
      connection: {
        type: {
          doc: 'The connection type used to connect to the camera',
          format: String,
          default: '',
        },
        parameters: {
          host: {
            doc: 'The IP address of the camera',
            format: 'ipaddress',
            default: '127.0.0.1',
          },
          port: {
            doc: 'The port of the TCP server on the camera',
            format: 'port',
            default: 5678,
          },
          serial_port: {
            doc: 'The serial port used to connect to the camera',
            format: String,
            default: '',
          },
        },
      },
      presets: {
        doc: 'An array of the presets stored in this system for the camera',
        format: Array,
        default: [],
        // TODO: determine the structure of the preset objects
      },
    },
  },
});

const minimistOptions = {
  string: 'config',
  alias: {
    config: 'c',
  },
  default: {
    config: './config/config.json',
  },
};

// first 2 args are `node`, `server.js`
const args = minimist(process.argv.slice(2), minimistOptions);

config.loadFile(args.config);
config.validate({allowed: 'strict'});

config.getCameraByID = function(id) {
  return config.get('cameras').find(function(camera) {
    return camera.id === id;
  });
};


module.exports = config;
