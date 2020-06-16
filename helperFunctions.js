'use strict';


function toHex(i) {
  let hexString = i.toString(16);
  if ((hexString.length % 2) !== 0) {
    hexString = '0' + hexString;
  }
  return hexString;
}

function createBufferFromString(string) {
  // convert to lowercase and remove whitespace
  let stringCommand = string.toLowerCase().replace(/\s/g, '');
  // eslint-disable-next-line new-cap
  return new Buffer.from(stringCommand, 'hex');
}

function constrain(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

module.exports = {
  toHex,
  createBufferFromString,
  constrain,
};
