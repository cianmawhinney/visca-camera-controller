const fs = require('fs');

/* Eventually, this module should manage reading and writing to the config file,
and be able to reload it live when the application is running */

function getConfiguration(configFile='config.json') {
  return JSON.parse(fs.readFileSync(configFile))
}

function getCameras() {
  return getConfiguration()['cameras']
}

function getCameraConfig(cameraId) {
   let camera_array = getConfiguration()["cameras"];
   for (let i=0; i < camera_array.length; i++) {
     if (camera_array[i].id == cameraId) {
       return camera_array[i]
     }
   }
   // nothing was found
   return undefined
}

module.exports = {
  getConfiguration,
  getCameraConfig,
  getCameras
}


// TODO: have defaults for when something isn't specified in the config file
