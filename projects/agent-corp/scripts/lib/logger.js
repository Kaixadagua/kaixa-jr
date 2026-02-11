/**
 * Agent Corp - Logger
 * Sistema de logging centralizado
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.colors = options.colors !== false;
    this.timestamps = options.timestamps !== false;
    this.outputFile = options.file || null;
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.colorsMap = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m'
    };
  }
  
  _shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }
  
  _format(level, message, meta = {}) {
    const parts = [];
    
    if (this.timestamps) {
      parts.push(`[${new Date().toISOString().slice(11, 19)}]`);
    }
    
    const icons = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      fox: '🦊'
    };
    
    parts.push(`${icons[level] || '📝'} [${level.toUpperCase()}]`);
    parts.push(message);
    
    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }
    
    return parts.join(' ');
  }
  
  _colorize(level, text) {
    if (!this.colors) return text;
    
    const colors = {
      debug: this.colorsMap.dim,
      info: this.colorsMap.cyan,
      warn: this.colorsMap.yellow,
      error: this.colorsMap.red,
      success: this.colorsMap.green,
      fox: this.colorsMap.bright + this.colorsMap.cyan
    };
    
    return `${colors[level] || ''}${text}${this.colorsMap.reset}`;
  }
  
  _write(level, message, meta) {
    if (!this._shouldLog(level)) return;
    
    const formatted = this._format(level, message, meta);
    const colorized = this._colorize(level, formatted);
    
    console.log(colorized);
    
    if (this.outputFile) {
      fs.appendFileSync(this.outputFile, formatted + '\n');
    }
  }
  
  debug(msg, meta) { this._write('debug', msg, meta); }
  info(msg, meta) { this._write('info', msg, meta); }
  warn(msg, meta) { this._write('warn', msg, meta); }
  error(msg, meta) { this._write('error', msg, meta); }
  success(msg, meta) { this._write('success', msg, meta); }
  fox(msg, meta) { this._write('fox', msg, meta); }
  
  section(title) {
    console.log('\n' + this._colorize('fox', `═══ ${title} ═══`) + '\n');
  }
  
  metric(name, value) {
    console.log(`  ${this._colorize('info', name)}: ${value}`);
  }
}

module.exports = Logger;
