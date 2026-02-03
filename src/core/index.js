/**
 * Kaixa Jr Core Modules
 * 
 * @module src/core
 */

const { Config, getConfig } = require('./config');
const { Logger, getLogger, LEVELS } = require('./logger');

module.exports = {
  Config,
  getConfig,
  Logger,
  getLogger,
  LEVELS
};
