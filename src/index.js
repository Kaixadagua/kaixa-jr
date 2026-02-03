/**
 * Kaixa Jr - Main Entry Point
 * 
 * @module src
 */

const core = require('./core');
const utils = require('./utils');

module.exports = {
  ...core,
  ...utils
};
