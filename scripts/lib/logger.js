/**
 * logger.js - Sistema de logging centralizado Kaixa Jr
 * 
 * Uso:
 *   const logger = require('./logger');
 *   logger.info('Mensagem');
 *   logger.success('Sucesso!');
 *   logger.warn('Aviso');
 *   logger.error('Erro', err);
 *   logger.debug('Debug', { detalhe: 123 });
 *   logger.section('Título');
 *   logger.metric('Nome', valor);
 *   logger.time('operação');
 *   logger.timeEnd('operação'); // → ⏱️ operação: 150ms
 *   logger.progress('Processando', 5, 10); // → 🔄 Processando [█████░░░░░] 5/10 items (50%)
 * 
 * Última atualização: 2026-02-08 - Adicionado progress() para tracking visual
 */

const fs = require('fs');
const path = require('path');

// Configurações
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SUCCESS: 1
};

const LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

// Emoji por nível
const EMOJIS = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅'
};

// Cores para terminal
const COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[34m',     // Blue
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  SUCCESS: '\x1b[32m',  // Green
  RESET: '\x1b[0m'
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'INFO';
    this.levelValue = LOG_LEVELS[this.level] ?? 1;
    this.logToFile = options.logToFile ?? true;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.sessionId = options.sessionId || this.generateSessionId();
    
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  generateSessionId() {
    return `kaixa-${Date.now().toString(36).slice(-6)}`;
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= this.levelValue;
  }

  log(level, message, meta = null) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.formatTimestamp();
    const emoji = EMOJIS[level] || '';
    
    // Console output com cores
    const color = COLORS[level] || '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${color}${emoji} [${timestamp}] ${message}${metaStr}${COLORS.RESET}`);

    // File output (sem cores)
    if (this.logToFile) {
      const logEntry = `[${timestamp}] [${level}] ${message}${metaStr}\n`;
      const logFile = path.join(this.logDir, `${this.sessionId}.log`);
      fs.appendFileSync(logFile, logEntry);
    }
  }

  debug(message, meta) { this.log('DEBUG', message, meta); }
  info(message, meta) { this.log('INFO', message, meta); }
  warn(message, meta) { this.log('WARN', message, meta); }
  error(message, meta) { this.log('ERROR', message, meta); }
  success(message, meta) { this.log('SUCCESS', message, meta); }

  // Logger section para agrupar logs
  section(title) {
    console.log(`\n${COLORS.INFO}━━━ ${title} ━━━${COLORS.RESET}\n`);
  }

  // Métricas rápidas
  metric(name, value) {
    console.log(`${COLORS.INFO}📊 ${name}: ${COLORS.SUCCESS}${value}${COLORS.RESET}`);
  }

  // Resultado de operação
  result(success, message) {
    if (success) {
      this.success(message);
    } else {
      this.error(message);
    }
  }

  // Timer para performance tracking
  time(label) {
    this._timers = this._timers || {};
    this._timers[label] = Date.now();
    this.debug(`Timer iniciado: ${label}`);
    return label;
  }

  timeEnd(label) {
    if (!this._timers || !this._timers[label]) {
      this.warn(`Timer não encontrado: ${label}`);
      return null;
    }
    const duration = Date.now() - this._timers[label];
    delete this._timers[label];
    this.metric(`⏱️ ${label}`, `${duration}ms`);
    return duration;
  }

  /**
   * Mostra progresso visual de operações longas
   * @param {string} label - Nome da operação
   * @param {number} current - Item atual
   * @param {number} total - Total de itens
   * @param {Object} [options] - Opções adicionais
   * @param {string} [options.itemName='item'] - Nome do item sendo processado
   * @param {boolean} [options.inline=true] - Se true, atualiza na mesma linha
   * @returns {string} Barra de progresso formatada
   * 
   * @example
   * for (let i = 0; i < files.length; i++) {
   *   processFile(files[i]);
   *   logger.progress('Processando arquivos', i + 1, files.length, { itemName: 'arquivo' });
   * }
   * // Saída: 🔄 Processando arquivos [██████░░░░] 6/10 arquivos (60%)
   */
  progress(label, current, total, options = {}) {
    const { itemName = 'item', inline = true } = options;
    const percentage = Math.min(100, Math.round((current / total) * 100));
    const filled = Math.round((percentage / 100) * 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    const output = `🔄 ${label} [${bar}] ${current}/${total} ${itemName}s (${percentage}%)`;
    
    if (inline && process.stdout && process.stdout.write) {
      // Limpa linha anterior e escreve nova (para atualização inline)
      process.stdout.write(`\r${COLORS.INFO}${output}${COLORS.RESET}`);
      if (current === total) {
        process.stdout.write('\n'); // Nova linha no final
      }
    } else {
      this.info(output);
    }
    
    return output;
  }
}

// Exporta instância padrão + classe
module.exports = new Logger();
module.exports.Logger = Logger;
