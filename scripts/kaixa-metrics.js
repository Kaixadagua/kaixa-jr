#!/usr/bin/env node
/**
 * @fileoverview Kaixa Metrics - Dashboard em tempo real para heartbeats
 * 
 * Exibe métricas consolidadas do sistema Kaixa Jr em formato compacto
 * para uso em heartbeats e verificações rápidas.
 * 
 * Uso:
 *   node scripts/kaixa-metrics.js           # Modo visual
 *   node scripts/kaixa-metrics.js --json    # Modo JSON (para automação)
 *   node scripts/kaixa-metrics.js --mini    # Modo ultra-compacto (1 linha)
 * 
 * @author Kaixa Jr
 * @since 2026-02-08
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  metricsPath: path.join(process.cwd(), 'memory', 'improvements', 'metrics.json'),
  trackingPath: path.join(process.cwd(), 'memory', 'improvements', 'TRACKING.md'),
  colors: {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SystemMetrics
 * @property {number} totalImprovements - Total de melhorias no sistema
 * @property {number} localImprovements - Melhorias locais
 * @property {number} prImprovements - Melhorias via PR
 * @property {number} openPRs - PRs abertos atualmente
 * @property {string} backpressureStatus - 🟢 🟡 ou 🔴
 * @property {number} throughput - Melhorias por hora
 * @property {string} lastImprovement - Timestamp da última melhoria
 */

/**
 * @typedef {Object} DashboardConfig
 * @property {boolean} json - Modo JSON
 * @property {boolean} mini - Modo compacto
 */

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES UTILITÁRIAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formata número com separador de milhares
 * @param {number} num - Número a formatar
 * @returns {string} Número formatado
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calcula tempo relativo ("2h atrás", "3d atrás")
 * @param {string} dateStr - Data ISO
 * @returns {string} Tempo relativo
 */
function timeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
  return `${Math.floor(diffMins / 1440)}d atrás`;
}

/**
 * Retorna emoji de status baseado em thresholds
 * @param {number} value - Valor atual
 * @param {number} warning - Threshold de aviso
 * @param {number} danger - Threshold de perigo
 * @returns {string} Emoji apropriado
 */
function statusEmoji(value, warning, danger) {
  if (value >= danger) return '🔴';
  if (value >= warning) return '🟡';
  return '🟢';
}

// ─────────────────────────────────────────────────────────────────────────────
// COLETA DE DADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coleta métricas do metrics.json
 * @returns {Object|null} Métricas ou null se não encontrado
 */
function getMetricsFromFile() {
  try {
    if (!fs.existsSync(CONFIG.metricsPath)) return null;
    const content = fs.readFileSync(CONFIG.metricsPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Extrai métricas do TRACKING.md
 * @returns {Object} Métricas extraídas
 */
function getMetricsFromTracking() {
  try {
    if (!fs.existsSync(CONFIG.trackingPath)) {
      return { total: 0, local: 0, pr: 0, openPRs: 0 };
    }
    
    const content = fs.readFileSync(CONFIG.trackingPath, 'utf8');
    
    // Extrai total de melhorias
    const totalMatch = content.match(/\*\*Total de melhorias\*\*\s*\|\s*(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    // Extrai melhorias locais
    const localMatch = content.match(/Melhorias locais\s*\|\s*(\d+)/);
    const local = localMatch ? parseInt(localMatch[1]) : 0;
    
    // Extrai PRs
    const prMatch = content.match(/Melhorias PR\s*\|\s*(\d+)/);
    const pr = prMatch ? parseInt(prMatch[1]) : 0;
    
    // Extrai PRs abertos
    const openMatch = content.match(/(\d+)\/9\s*PRs/);
    const openPRs = openMatch ? parseInt(openMatch[1]) : 0;
    
    // Extrai throughput
    const throughputMatch = content.match(/([\d.]+)\s*melhorias\/hora/);
    const throughput = throughputMatch ? parseFloat(throughputMatch[1]) : 0;
    
    return { total, local, pr, openPRs, throughput };
  } catch (err) {
    return { total: 0, local: 0, pr: 0, openPRs: 0, throughput: 0 };
  }
}

/**
 * Verifica PRs abertos via gh CLI
 * @returns {number} Número de PRs abertos
 */
function getOpenPRs() {
  try {
    const output = execSync('gh pr list --state open --json number --limit 100', { 
      encoding: 'utf8',
      timeout: 5000
    });
    const prs = JSON.parse(output);
    return prs.length;
  } catch (err) {
    return -1; // Indica erro
  }
}

/**
 * Coleta todas as métricas do sistema
 * @returns {SystemMetrics} Métricas consolidadas
 */
function collectMetrics() {
  const fileMetrics = getMetricsFromFile();
  const trackingMetrics = getMetricsFromTracking();
  const ghPRs = getOpenPRs();
  
  const openPRs = ghPRs >= 0 ? ghPRs : trackingMetrics.openPRs;
  const backpressureStatus = statusEmoji(openPRs, 6, 9);
  
  return {
    totalImprovements: fileMetrics?.totals?.totalImprovements || trackingMetrics.total || 0,
    localImprovements: fileMetrics?.totals?.localImprovements || trackingMetrics.local || 0,
    prImprovements: fileMetrics?.totals?.prImprovements || trackingMetrics.pr || 0,
    openPRs,
    backpressureStatus,
    throughput: trackingMetrics.throughput || 0,
    lastImprovement: fileMetrics?.lastUpdated || null,
    ghAvailable: ghPRs >= 0
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renderiza dashboard visual
 * @param {SystemMetrics} metrics - Métricas a renderizar
 */
function renderDashboard(metrics) {
  const { cyan, green, yellow, red, gray, reset } = CONFIG.colors;
  
  console.log('');
  console.log(`${cyan}╔════════════════════════════════════════╗${reset}`);
  console.log(`${cyan}║${reset}      🦊 KAIXA METRICS - DASHBOARD      ${cyan}║${reset}`);
  console.log(`${cyan}╚════════════════════════════════════════╝${reset}`);
  console.log('');
  
  // Métricas principais
  const totalColor = metrics.totalImprovements >= 50 ? green : cyan;
  console.log(`  ${totalColor}${formatNumber(metrics.totalImprovements)}${reset} melhorias totais`);
  console.log(`  ${green}${formatNumber(metrics.localImprovements)}${reset} locais  |  ${yellow}${formatNumber(metrics.prImprovements)}${reset} via PR`);
  console.log('');
  
  // Backpressure
  const prColor = metrics.openPRs >= 9 ? red : (metrics.openPRs >= 6 ? yellow : green);
  console.log(`  Backpressure: ${metrics.backpressureStatus} ${prColor}${metrics.openPRs}${reset}/9 PRs`);
  console.log(`  Throughput: ${cyan}${metrics.throughput.toFixed(2)}${reset} melhorias/hora`);
  console.log('');
  
  // Última atividade
  if (metrics.lastImprovement) {
    console.log(`  Última melhoria: ${gray}${timeAgo(metrics.lastImprovement)}${reset}`);
  }
  
  // Status do gh
  if (!metrics.ghAvailable) {
    console.log(`  ${yellow}⚠️  gh CLI indisponível (usando cache)${reset}`);
  }
  
  console.log('');
}

/**
 * Renderiza modo JSON
 * @param {SystemMetrics} metrics - Métricas a renderizar
 */
function renderJSON(metrics) {
  console.log(JSON.stringify(metrics, null, 2));
}

/**
 * Renderiza modo ultra-compacto
 * @param {SystemMetrics} metrics - Métricas a renderizar
 */
function renderMini(metrics) {
  const parts = [
    `🦊`,
    `${metrics.totalImprovements}melh`,
    `${metrics.backpressureStatus}${metrics.openPRs}/9`,
    `${metrics.throughput.toFixed(1)}/h`
  ];
  console.log(parts.join(' '));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Função principal
 * @param {string[]} args - Argumentos da linha de comando
 */
function main(args = process.argv.slice(2)) {
  const isJson = args.includes('--json');
  const isMini = args.includes('--mini');
  
  const metrics = collectMetrics();
  
  if (isJson) {
    renderJSON(metrics);
  } else if (isMini) {
    renderMini(metrics);
  } else {
    renderDashboard(metrics);
  }
  
  // Exit code baseado em backpressure
  process.exit(metrics.openPRs >= 9 ? 1 : 0);
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { collectMetrics, renderDashboard, renderJSON, renderMini };
