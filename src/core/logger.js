/**
 * Kaixa Jr Logger
 * Professional logging system
 * 
 * @module src/core/logger
 */

const fs = require('fs');
const path = require('path');

/**
 * Log levels
 */
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * Logger class
 * @class Logger
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.levelValue = LEVELS[this.level.toUpperCase()] || LEVELS.INFO;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.logFile = options.logFile || 'kaixa.log';
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    this.ensureLogDir();
  }
  
  /**
   * Ensure log directory exists
   * @method ensureLogDir
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Format log message
   * @method format
   */
  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  }
  
  /**
   * Write to console
   * @method console
   */
  logConsole(level, formattedMessage) {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m', // Magenta
      RESET: '\x1b[0m'
    };
    
    const color = colors[level.toUpperCase()] || colors.RESET;
    console.log(`${color}${formattedMessage}${colors.RESET}`);
  }
  
  /**
   * Write to file
   * @method logFile
   */
  logFile(formattedMessage) {
    const filePath = path.join(this.logDir, this.logFile);
    
    // Rotate if needed
    this.rotateIfNeeded(filePath);
    
    // Append to file
    fs.appendFileSync(filePath, formattedMessage + '\n');
  }
  
  /**
   * Rotate log file if too large
   * @method rotateIfNeeded
   */
  rotateIfNeeded(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxSize) {
      // Rotate existing files
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldPath = `${filePath}.${i}`;
        const newPath = `${filePath}.${i + 1}`;
        
        if (fs.existsSync(oldPath)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldPath);
          } else {
            fs.renameSync(oldPath, newPath);
          }
        }
      }
      
      // Rotate current file
      fs.renameSync(filePath, `${filePath}.1`);
    }
  }
  
  /**
   * Main log method
   * @method log
   */
  log(level, message, meta = {}) {
    const levelValue = LEVELS[level.toUpperCase()];
    
    if (levelValue < this.levelValue) {
      return;
    }
    
    const formatted = this.format(level, message, meta);
    
    this.logConsole(level, formatted);
    this.logFile(formatted);
  }
  
  /**
   * Log methods for each level
   */
  debug(message, meta) {
    this.log('DEBUG', message, meta);
  }
  
  info(message, meta) {
    this.log('INFO', message, meta);
  }
  
  warn(message, meta) {
    this.log('WARN', message, meta);
  }
  
  error(message, meta) {
    this.log('ERROR', message, meta);
  }
  
  fatal(message, meta) {
    this.log('FATAL', message, meta);
  }
  
  /**
   * Log with emoji prefix
   * @method emoji
   */
  emoji(emoji, message, meta) {
    this.info(`${emoji} ${message}`, meta);
  }
}

// Singleton
let instance = null;

function getLogger(options) {
  if (!instance) {
    instance = new Logger(options);
  }
  return instance;
}

module.exports = { Logger, getLogger, LEVELS };
