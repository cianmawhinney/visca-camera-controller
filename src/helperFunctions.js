'use strict';

/**
 * Returns a hex encoded string which is always an even length
 * @param {number} value Value to convert to a padded hex string
 */
function toHex(value) {
  let hexString = value.toString(16);
  if ((hexString.length % 2) !== 0) {
    hexString = '0' + hexString;
  }
  return hexString;
}

/**
 * Removes any whitespace and returns a Buffer object with the contents of the
 * hex string
 * @param {string} hexString Hex encoded string
 */
function createBufferFromString(hexString) {
  // convert to lowercase and remove whitespace
  let stringCommand = hexString.toLowerCase().replace(/\s/g, '');
  // eslint-disable-next-line new-cap
  return new Buffer.from(stringCommand, 'hex');
}

/**
 * Returns a numerical value from a string padded with 0s in evenly indexed
 * positions
 * @param {string} string Padded value in form 0p0q0r0s
 */
function parseValueFromPaddedHexString(string) {
  let map = Array.prototype.map;
  // grab every other 'character' (ie. 0p 0q 0r 0s becomes pqrs)
  let value = map.call(string, (char, i) => (i % 2) ? char : '').join('');
  return parseInt(value, 16);
}

/**
 * Constrains a number to be within a range
 * @param {number} value Value to be constrained between `low` and `high`
 * @param {number} low Minumum acceptable value
 * @param {number} high Maximum acceptable value
 */
function constrain(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

module.exports = {
  toHex,
  createBufferFromString,
  parseValueFromPaddedHexString,
  constrain,
};
