#!/usr/bin/env node
/**
 * @fileoverview Kaixa Notify - Sistema de notificações inteligente
 * 
 * Detecta estados críticos do sistema e notifica automaticamente.
 * Suporta múltiplos canais: console, arquivo, e integração futura com webhooks.
 * 
 * @module scripts/lib/kaixaNotify
 * @author Kaixa Jr
 * @since 2026-02-09
 * @example
 * const notify = require('./scripts/lib/kaixaNotify');
 * notify.alert('Backpressure crítico detectado!', { level: 'critical' });
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Níveis de severidade das notificações
 * @readonly
 * @enum {string}
 */
const SEVERITY = {
  /** Informação geral, não requer ação */
  INFO: 'info',
  /** Atenção, monitorar situação */
  WARNING: 'warning',
  /** Problema que precisa de atenção em breve */
  ERROR: 'error',
  /** Situação crítica, requer ação imediata */
  CRITICAL: 'critical'
};

/**
 * Configuração padrão do sistema de notificações
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
  logDir: 'memory/notifications',
  maxHistory: 100,
  consoleOutput: true,
  fileOutput: true,
  /** Thresholds para alertas automáticos */
  thresholds: {
    backpressure: { warning: 6, critical: 9 },
    failedRuns: { warning: 2, critical: 5 },
    memoryUsage: { warning: 80, critical: 95 }
  }
};

/**
 * Cores para console output
 * @constant {Object}
 */
const COLORS = {
  info: '\x1b[36m',    // Cyan
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
  critical: '\x1b[35m', // Magenta
  reset: '\x1b[0m'
};

/**
 * Emojis por severidade
 * @constant {Object}
 */
const EMOJIS = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  critical: '🚨'
};

/**
 * Garante que o diretório de logs exista
 * @private
 */
function ensureLogDir() {
  const dir = path.join(process.cwd(), DEFAULT_CONFIG.logDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Gera timestamp formatado
 * @returns {string} Timestamp ISO
 * @private
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Gera ID único para notificação
 * @returns {string} ID único
 * @private
 */
function generateId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Persiste notificação em arquivo JSONL
 * @param {Notification} notification - Notificação a persistir
 * @private
 */
function persistNotification(notification) {
  const dir = ensureLogDir();
  const file = path.join(dir, 'history.jsonl');
  const line = JSON.stringify(notification) + '\n';
  fs.appendFileSync(file, line);
}

/**
 * Lê histórico de notificações
 * @param {number} [limit=50] - Quantidade máxima de notificações
 * @returns {Notification[]} Array de notificações
 */
function getHistory(limit = 50) {
  const file = path.join(process.cwd(), DEFAULT_CONFIG.logDir, 'history.jsonl');
  
  if (!fs.existsSync(file)) {
    return [];
  }
  
  const lines = fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .slice(-limit);
  
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Envia notificação
 * @param {string} message - Mensagem da notificação
 * @param {Object} [options={}] - Opções da notificação
 * @param {string} [options.level='info'] - Nível de severidade
 * @param {string} [options.source='kaixa-system'] - Fonte da notificação
 * @param {Object} [options.meta={}] - Metadados adicionais
 * @returns {Notification} Notificação criada
 */
function notify(message, options = {}) {
  const {
    level = SEVERITY.INFO,
    source = 'kaixa-system',
    meta = {}
  } = options;

  const notification = {
    id: generateId(),
    timestamp: getTimestamp(),
    level,
    message,
    source,
    meta
  };

  // Console output
  if (DEFAULT_CONFIG.consoleOutput) {
    const color = COLORS[level] || COLORS.info;
    const emoji = EMOJIS[level] || '';
    console.log(
      `${color}${emoji} [${level.toUpperCase()}]${COLORS.reset} ${message}`,
      Object.keys(meta).length > 0 ? meta : ''
    );
  }

  // File output
  if (DEFAULT_CONFIG.fileOutput) {
    persistNotification(notification);
  }

  return notification;
}

/**
 * Atalho para notificação de info
 * @param {string} message - Mensagem
 * @param {Object} [meta] - Metadados
 * @returns {Notification}
 */
function info(message, meta) {
  return notify(message, { level: SEVERITY.INFO, meta });
}

/**
 * Atalho para notificação de warning
 * @param {string} message - Mensagem
 * @param {Object} [meta] - Metadados
 * @returns {Notification}
 */
function warning(message, meta) {
  return notify(message, { level: SEVERITY.WARNING, meta });
}

/**
 * Atalho para notificação de error
 * @param {string} message - Mensagem
 * @param {Object} [meta] - Metadados
 * @returns {Notification}
 */
function error(message, meta) {
  return notify(message, { level: SEVERITY.ERROR, meta });
}

/**
 * Atalho para notificação crítica
 * @param {string} message - Mensagem
 * @param {Object} [meta] - Metadados
 * @returns {Notification}
 */
function critical(message, meta) {
  return notify(message, { level: SEVERITY.CRITICAL, meta });
}

/**
 * Verifica estado do sistema e notifica se necessário
 * @returns {SystemStatus} Status do sistema
 */
function checkSystemStatus() {
  const status = {
    timestamp: getTimestamp(),
    healthy: true,
    checks: {},
    notifications: []
  };

  // Check 1: Backpressure
  try {
    const prList = execSync(
      'gh pr list --repo aura-io-saas/aurahub --state open --json number',
      { encoding: 'utf8', cwd: process.cwd() }
    );
    const prs = JSON.parse(prList || '[]');
    const prCount = prs.length;
    
    status.checks.backpressure = {
      value: prCount,
      threshold: DEFAULT_CONFIG.thresholds.backpressure,
      status: prCount >= DEFAULT_CONFIG.thresholds.backpressure.critical ? 'critical' :
              prCount >= DEFAULT_CONFIG.thresholds.backpressure.warning ? 'warning' : 'ok'
    };

    if (prCount >= DEFAULT_CONFIG.thresholds.backpressure.critical) {
      const notif = critical('Backpressure CRÍTICO detectado!', {
        prCount,
        threshold: DEFAULT_CONFIG.thresholds.backpressure.critical,
        action: 'Pausar novos PRs, focar em documentação local'
      });
      status.notifications.push(notif);
      status.healthy = false;
    } else if (prCount >= DEFAULT_CONFIG.thresholds.backpressure.warning) {
      const notif = warning('Backpressure elevado', {
        prCount,
        threshold: DEFAULT_CONFIG.thresholds.backpressure.warning
      });
      status.notifications.push(notif);
    }
  } catch (e) {
    status.checks.backpressure = { error: e.message };
  }

  // Check 2: Métricas de execução
  try {
    const metricsPath = path.join(process.cwd(), 'memory/improvements/metrics.json');
    if (fs.existsSync(metricsPath)) {
      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      const failedStreak = calculateFailedStreak(metrics.history);
      
      status.checks.execution = {
        totalRuns: metrics.totalRuns,
        successfulRuns: metrics.successfulRuns,
        failedStreak,
        status: failedStreak >= DEFAULT_CONFIG.thresholds.failedRuns.critical ? 'critical' :
                failedStreak >= DEFAULT_CONFIG.thresholds.failedRuns.warning ? 'warning' : 'ok'
      };

      if (failedStreak >= DEFAULT_CONFIG.thresholds.failedRuns.critical) {
        const notif = critical('Múltiplas falhas consecutivas detectadas!', {
          failedStreak,
          action: 'Verificar logs e estado do sistema'
        });
        status.notifications.push(notif);
        status.healthy = false;
      }
    }
  } catch (e) {
    status.checks.execution = { error: e.message };
  }

  // Check 3: Sessões ativas
  try {
    // Verifica se há sessões ativas via openclaw
    const sessions = execSync('openclaw sessions list --json 2>nul || echo "[]"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    const activeSessions = JSON.parse(sessions || '[]').filter(s => s.active);
    
    status.checks.sessions = {
      count: activeSessions.length,
      status: activeSessions.length > 2 ? 'warning' : 'ok'
    };

    if (activeSessions.length > 2) {
      const notif = warning('Múltiplas sessões ativas detectadas', {
        count: activeSessions.length,
        sessions: activeSessions.map(s => s.agentId || s.id)
      });
      status.notifications.push(notif);
    }
  } catch (e) {
    // openclaw pode não estar disponível, ignora silenciosamente
    status.checks.sessions = { status: 'unknown' };
  }

  // Resumo
  if (status.healthy && status.notifications.length === 0) {
    info('System check completo: todos os sistemas operacionais', {
      checks: Object.keys(status.checks).length
    });
  }

  return status;
}

/**
 * Calcula sequência de falhas consecutivas
 * @param {Array} history - Histórico de execuções
 * @returns {number} Número de falhas consecutivas
 * @private
 */
function calculateFailedStreak(history = []) {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i].success) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Limpa histórico antigo de notificações
 * @param {number} [keepDays=7] - Dias a manter
 * @returns {number} Número de entradas removidas
 */
function cleanupOldNotifications(keepDays = 7) {
  const file = path.join(process.cwd(), DEFAULT_CONFIG.logDir, 'history.jsonl');
  
  if (!fs.existsSync(file)) {
    return 0;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);

  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(line => line.trim());
  const filtered = lines.filter(line => {
    try {
      const notif = JSON.parse(line);
      return new Date(notif.timestamp) >= cutoff;
    } catch {
      return false;
    }
  });

  const removed = lines.length - filtered.length;
  fs.writeFileSync(file, filtered.join('\n') + (filtered.length > 0 ? '\n' : ''));
  
  info('Cleanup de notificações concluído', { removed, kept: filtered.length });
  return removed;
}

/**
 * Exporta relatório de notificações
 * @param {Object} [options] - Opções do relatório
 * @param {string} [options.format='markdown'] - Formato: 'markdown' | 'json'
 * @param {number} [options.hours=24] - Horas a incluir
 * @returns {string} Relatório formatado
 */
function exportReport(options = {}) {
  const { format = 'markdown', hours = 24 } = options;
  
  const history = getHistory(DEFAULT_CONFIG.maxHistory);
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  
  const recent = history.filter(n => new Date(n.timestamp) >= cutoff);
  
  if (format === 'json') {
    return JSON.stringify(recent, null, 2);
  }

  // Markdown format
  let report = `# 📊 Relatório de Notificações\n\n`;
  report += `**Período:** Últimas ${hours}h\n`;
  report += `**Total:** ${recent.length} notificações\n\n`;
  
  const byLevel = recent.reduce((acc, n) => {
    acc[n.level] = (acc[n.level] || 0) + 1;
    return acc;
  }, {});
  
  report += `## Por Severidade\n\n`;
  Object.entries(byLevel).forEach(([level, count]) => {
    const emoji = EMOJIS[level] || '';
    report += `- ${emoji} **${level}:** ${count}\n`;
  });
  
  report += `\n## Detalhes\n\n`;
  recent.slice(-20).forEach(n => {
    const date = new Date(n.timestamp).toLocaleString();
    report += `### ${EMOJIS[n.level]} ${date}\n`;
    report += `- **Mensagem:** ${n.message}\n`;
    report += `- **Fonte:** ${n.source}\n`;
    if (Object.keys(n.meta).length > 0) {
      report += `- **Meta:** \` + JSON.stringify(n.meta) + `\`\n`;
    }
    report += `\n`;
  });

  return report;
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      checkSystemStatus();
      break;
    case 'history':
      console.log(JSON.stringify(getHistory(), null, 2));
      break;
    case 'cleanup':
      const days = parseInt(args[1]) || 7;
      cleanupOldNotifications(days);
      break;
    case 'report':
      const hours = parseInt(args[1]) || 24;
      console.log(exportReport({ hours }));
      break;
    default:
      console.log(`
🦊 Kaixa Notify - Sistema de Notificações

Uso: node scripts/lib/kaixaNotify.js [comando]

Comandos:
  check              Verifica status do sistema
  history            Mostra histórico de notificações
  cleanup [dias]     Limpa notificações antigas (padrão: 7 dias)
  report [horas]     Gera relatório (padrão: 24h)

Exemplos:
  node scripts/lib/kaixaNotify.js check
  node scripts/lib/kaixaNotify.js cleanup 3
  node scripts/lib/kaixaNotify.js report 48
      `);
  }
}

module.exports = {
  SEVERITY,
  notify,
  info,
  warning,
  error,
  critical,
  checkSystemStatus,
  getHistory,
  cleanupOldNotifications,
  exportReport
};
