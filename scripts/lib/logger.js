/**
 * @fileoverview Logger Centralizado - Sistema de logging estruturado para scripts
 * @description Logger com níveis, rotação automática e saída JSONL
 * @module scripts/lib/logger
 * @author Kaixa Jr 🦊
 * @since 2026-02-09
 */

const fs = require('fs');
const path = require('path');

/**
 * Níveis de log disponíveis
 * @readonly
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * Emojis por nível de log
 * @readonly
 * @type {Object<string, string>}
 */
const LevelEmoji = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  FATAL: '💥'
};

/**
 * Cores ANSI para terminal
 * @readonly
 * @type {Object<string, string>}
 */
const LevelColor = {
  DEBUG: '\x1b[90m',  // Gray
  INFO: '\x1b[36m',   // Cyan
  WARN: '\x1b[33m',   // Yellow
  ERROR: '\x1b[31m',  // Red
  FATAL: '\x1b[35m',  // Magenta
  RESET: '\x1b[0m'
};

/**
 * Classe Logger - Logging estruturado com rotação
 */
class Logger {
  /**
   * Cria uma instância do Logger
   * @param {Object} options - Opções de configuração
   * @param {string} [options.name='default'] - Nome do logger
   * @param {string} [options.logDir='memory/logs'] - Diretório de logs
   * @param {string} [options.level='INFO'] - Nível mínimo de log
   * @param {boolean} [options.useColors=true] - Usar cores no terminal
   * @param {boolean} [options.jsonl=true] - Salvar em formato JSONL
   * @param {number} [options.maxFileSize=10*1024*1024] - Tamanho máximo do arquivo (10MB)
   * @param {number} [options.maxFiles=5] - Número máximo de arquivos rotacionados
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.logDir = options.logDir || 'memory/logs';
    this.level = LogLevel[options.level?.toUpperCase()] || LogLevel.INFO;
    this.useColors = options.useColors !== false;
    this.jsonl = options.jsonl !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    this._ensureLogDir();
    this._logBuffer = [];
    this._flushInterval = null;
    this._startFlushInterval();
  }

  /**
   * Garante que o diretório de logs existe
   * @private
   */
  _ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Obtém o caminho do arquivo de log atual
   * @private
   * @returns {string}
   */
  _getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${this.name}-${date}.jsonl`);
  }

  /**
   * Verifica se é necessário rotacionar o log
   * @private
   * @returns {boolean}
   */
  _shouldRotate() {
    const logFile = this._getLogFile();
    if (!fs.existsSync(logFile)) return false;
    
    const stats = fs.statSync(logFile);
    return stats.size >= this.maxFileSize;
  }

  /**
   * Rotaciona o arquivo de log
   * @private
   */
  _rotateLog() {
    const baseFile = this._getLogFile();
    
    // Remove arquivo mais antigo se necessário
    const oldestFile = `${baseFile}.${this.maxFiles}`;
    if (fs.existsSync(oldestFile)) {
      fs.unlinkSync(oldestFile);
    }
    
    // Move arquivos existentes
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${baseFile}.${i}`;
      const newFile = `${baseFile}.${i + 1}`;
      if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
      }
    }
    
    // Move arquivo atual
    if (fs.existsSync(baseFile)) {
      fs.renameSync(baseFile, `${baseFile}.1`);
    }
  }

  /**
   * Inicia intervalo de flush automático
   * @private
   */
  _startFlushInterval() {
    this._flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush a cada 5 segundos
    
    // Garante flush no exit
    process.on('exit', () => this.flush());
    process.on('SIGINT', () => {
      this.flush();
      process.exit(0);
    });
  }

  /**
   * Para o intervalo de flush
   * @private
   */
  _stopFlushInterval() {
    if (this._flushInterval) {
      clearInterval(this._flushInterval);
      this._flushInterval = null;
    }
  }

  /**
   * Formata mensagem para saída de console
   * @private
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   * @returns {string}
   */
  _formatConsole(level, message, meta) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const emoji = LevelEmoji[level];
    const color = this.useColors ? LevelColor[level] : '';
    const reset = this.useColors ? LevelColor.RESET : '';
    
    let output = `${color}[${timestamp}] ${emoji} ${message}${reset}`;
    
    if (meta && Object.keys(meta).length > 0) {
      const metaStr = Object.entries(meta)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');
      output += ` ${color}{${metaStr}}${reset}`;
    }
    
    return output;
  }

  /**
   * Formata entrada para JSONL
   * @private
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   * @returns {string}
   */
  _formatJsonl(level, message, meta) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      logger: this.name,
      msg: message,
      ...meta
    };
    return JSON.stringify(entry);
  }

  /**
   * Escreve log no nível especificado
   * @private
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   */
  _write(level, message, meta = {}) {
    const levelValue = LogLevel[level];
    
    if (levelValue < this.level) return;

    // Console output
    console.log(this._formatConsole(level, message, meta));

    // Buffer para arquivo
    if (this.jsonl) {
      this._logBuffer.push(this._formatJsonl(level, message, meta));
    }
  }

  /**
   * Força escrita do buffer no arquivo
   */
  flush() {
    if (this._logBuffer.length === 0) return;

    try {
      if (this._shouldRotate()) {
        this._rotateLog();
      }

      const logFile = this._getLogFile();
      const data = this._logBuffer.join('\n') + '\n';
      fs.appendFileSync(logFile, data);
      this._logBuffer = [];
    } catch (err) {
      console.error('Failed to flush logs:', err.message);
    }
  }

  // ==========================================================================
  // Métodos Públicos
  // ==========================================================================

  /**
   * Log de debug
   * @param {string} message - Mensagem
   * @param {Object} [meta] - Metadados
   */
  debug(message, meta) { this._write('DEBUG', message, meta); }

  /**
   * Log de info
   * @param {string} message - Mensagem
   * @param {Object} [meta] - Metadados
   */
  info(message, meta) { this._write('INFO', message, meta); }

  /**
   * Log de warning
   * @param {string} message - Mensagem
   * @param {Object} [meta] - Metadados
   */
  warn(message, meta) { this._write('WARN', message, meta); }

  /**
   * Log de error
   * @param {string} message - Mensagem
   * @param {Object} [meta] - Metadados
   */
  error(message, meta) { this._write('ERROR', message, meta); }

  /**
   * Log de fatal + exit
   * @param {string} message - Mensagem
   * @param {Object} [meta] - Metadados
   * @param {number} [exitCode=1] - Código de saída
   */
  fatal(message, meta, exitCode = 1) {
    this._write('FATAL', message, meta);
    this.flush();
    process.exit(exitCode);
  }

  /**
   * Log de início de operação
   * @param {string} operation - Nome da operação
   * @param {Object} [meta] - Metadados
   */
  start(operation, meta) {
    this._write('INFO', `▶️ ${operation}`, { ...meta, phase: 'start' });
  }

  /**
   * Log de sucesso de operação
   * @param {string} operation - Nome da operação
   * @param {Object} [meta] - Metadados
   */
  success(operation, meta) {
    this._write('INFO', `✅ ${operation}`, { ...meta, phase: 'success' });
  }

  /**
   * Log de falha de operação
   * @param {string} operation - Nome da operação
   * @param {Error|string} error - Erro
   * @param {Object} [meta] - Metadados
   */
  fail(operation, error, meta) {
    const errorMsg = error instanceof Error ? error.message : error;
    this._write('ERROR', `❌ ${operation}`, { ...meta, error: errorMsg, phase: 'fail' });
  }

  /**
   * Cria um child logger com contexto adicional
   * @param {Object} context - Contexto a incluir em todos os logs
   * @returns {Logger}
   */
  child(context) {
    const childLogger = new Logger({
      name: this.name,
      logDir: this.logDir,
      level: Object.keys(LogLevel)[this.level],
      useColors: this.useColors,
      jsonl: this.jsonl
    });
    
    // Sobrescreve _write para incluir contexto
    const originalWrite = childLogger._write.bind(childLogger);
    childLogger._write = (level, message, meta = {}) => {
      originalWrite(level, message, { ...context, ...meta });
    };
    
    return childLogger;
  }

  /**
   * Fecha o logger e flusha logs pendentes
   */
  close() {
    this._stopFlushInterval();
    this.flush();
  }
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = { Logger, LogLevel, LevelEmoji, LevelColor };

// CLI para teste
if (require.main === module) {
  const logger = new Logger({ name: 'test', level: 'DEBUG' });
  
  logger.debug('Debug message', { detail: 'value' });
  logger.info('Info message');
  logger.warn('Warning message', { count: 42 });
  logger.start('Operation X');
  logger.success('Operation X');
  logger.fail('Operation Y', new Error('Something failed'));
  
  const child = logger.child({ requestId: '123' });
  child.info('Child logger message');
  
  logger.close();
  console.log('\n✅ Teste concluído. Verifique memory/logs/');
}
