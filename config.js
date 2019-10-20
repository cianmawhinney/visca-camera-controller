'use strict';

const fs = require('fs');

// TODO: use config module instead of dealing with the raw file


/* Eventually, this module should manage reading and writing to the config file,
and be able to reload it live when the application is running */

function getConfiguration(configFile = 'config.json') {
  return JSON.parse(fs.readFileSync(configFile));
}

function getCameras() {
  return getConfiguration().cameras;
}

function getCameraConfig(id) {
  return getCameras().find(function(camera) {
    return camera.id === id;
  });
}

module.exports = {
  getConfiguration,
  getCameraConfig,
  getCameras,
};
