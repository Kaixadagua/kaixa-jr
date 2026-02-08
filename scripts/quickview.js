#!/usr/bin/env node
/**
 * @fileoverview Kaixa QuickView - Dashboard rápido de saúde do sistema
 * @description Exibe status consolidado em formato compacto para heartbeat/cron
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/quickview.js [--json]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Configurações do QuickView
 * @constant {Object}
 */
const CONFIG = {
  maxAgents: 2,
  warningTokens: 150000,
  criticalTokens: 180000,
  reportDir: 'scripts/reports'
};

/**
 * Obtém sessões ativas
 * @returns {Array} Lista de sessões
 */
function getSessions() {
  try {
    const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
    return JSON.parse(output).sessions || [];
  } catch {
    return [];
  }
}

/**
 * Conta melhorias do dia
 * @returns {number} Quantidade de melhorias
 */
function countImprovements() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dir = 'memory/improvements';
    if (!fs.existsSync(dir)) return 0;
    
    return fs.readdirSync(dir)
      .filter(f => f.startsWith(today) && f.includes('melhoria'))
      .length;
  } catch {
    return 0;
  }
}

/**
 * Carrega último relatório do Guardian
 * @returns {Object|null} Último relatório
 */
function getLastGuardianReport() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const filepath = path.join(CONFIG.reportDir, `guardian-${today}.json`);
    
    if (!fs.existsSync(filepath)) return null;
    
    const reports = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    return reports.length > 0 ? reports[reports.length - 1] : null;
  } catch {
    return null;
  }
}

/**
 * Formata número de tokens
 * @param {number} tokens 
 * @returns {string}
 */
function formatTokens(tokens) {
  if (!tokens) return '0k';
  return `${(tokens / 1000).toFixed(1)}k`;
}

/**
 * Obtém indicador visual de status
 * @param {string} status 
 * @returns {string}
 */
function getStatusEmoji(status) {
  const map = { healthy: '🟢', warning: '🟡', critical: '🔴', unknown: '⚪' };
  return map[status] || '⚪';
}

/**
 * Gera visualização rápida
 * @param {boolean} jsonOutput - Se true, retorna JSON
 */
function quickView(jsonOutput = false) {
  const sessions = getSessions();
  const guardian = getLastGuardianReport();
  const improvements = countImprovements();
  
  // Contar agentes reais (subagentes)
  const subAgents = sessions.filter(s => s.kind === 'subagent');
  const agentCount = subAgents.length;
  
  // Contar tokens
  const totalTokens = subAgents.reduce((sum, s) => sum + (s.totalTokens || 0), 0);
  
  // Determinar status
  let status = 'healthy';
  if (agentCount > CONFIG.maxAgents || totalTokens > CONFIG.criticalTokens) {
    status = 'critical';
  } else if (totalTokens > CONFIG.warningTokens) {
    status = 'warning';
  }
  
  // Backpressure
  const backpressure = guardian?.backpressure || { count: -1, status: 'unknown' };
  
  const data = {
    timestamp: new Date().toISOString(),
    status,
    agents: {
      active: agentCount,
      max: CONFIG.maxAgents,
      ok: agentCount <= CONFIG.maxAgents
    },
    tokens: {
      total: totalTokens,
      formatted: formatTokens(totalTokens),
      warning: CONFIG.warningTokens,
      critical: CONFIG.criticalTokens
    },
    backpressure: {
      prs: backpressure.count,
      status: backpressure.status,
      blocked: backpressure.status === 'red'
    },
    improvements: {
      today: improvements
    },
    summary: `${getStatusEmoji(status)} ${agentCount}/${CONFIG.maxAgents} agents · ${formatTokens(totalTokens)} tokens · ${backpressure.count} PRs · ${improvements} improvements today`
  };
  
  if (jsonOutput) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`
╔════════════════════════════════════════════════╗
║  🦊 KAIXA QUICKVIEW  ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}                    ║
╠════════════════════════════════════════════════╣
║  ${getStatusEmoji(status)} System: ${status.toUpperCase().padEnd(35)}║
║  👥 Agents: ${agentCount}/${CONFIG.maxAgents}${agentCount > CONFIG.maxAgents ? ' ⚠️' : '   '}                              ║
║  💾 Tokens: ${formatTokens(totalTokens).padEnd(8)} ${totalTokens > CONFIG.warningTokens ? '⚠️' : ' '}                       ║
║  📊 Backpressure: ${backpressure.count} PRs ${getStatusEmoji(backpressure.status)}${' '.repeat(12)}║
║  🚀 Improvements today: ${improvements}${' '.repeat(21)}║
╚════════════════════════════════════════════════╝
    `);
  }
  
  return data;
}

// CLI
const isJson = process.argv.includes('--json');
quickView(isJson);
