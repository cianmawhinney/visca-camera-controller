'use strict';

const convict = require('convict');

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
    default: 80,
    env: 'PORT',
    arg: 'port',
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
      host: {
        doc: 'The IP address of the camera',
        format: String,
        default: '127.0.0.1',
      },
      port: {
        doc: 'The port of the TCP server on the camera',
        format: 'port',
        default: 5678,
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

config.loadFile('config.json');
config.validate({allowed: 'strict'});

config.getCameraByID = function(id) {
  return config.get('cameras').find(function(camera) {
    return camera.id === id;
  });
};


module.exports = config;
