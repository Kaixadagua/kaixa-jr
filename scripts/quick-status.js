#!/usr/bin/env node
/**
 * @fileoverview Quick Status - Verificação ultrarrápida para heartbeats
 * 
 * Retorna status do sistema em formato minimalista (1 linha).
 * Útil para heartbeats que precisam de visibilidade rápida.
 * 
 * @example
 * node scripts/quick-status.js
 * // 🦊 61m | 🔴 BP | ✅ 0a | 💾 8Δ
 * 
 * @example
 * node scripts/quick-status.js --emoji
 * // 🟢 Tudo ok | 0 agentes | 0 tokens
 * 
 * @author Kaixa Jr
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, '..', 'memory', 'improvements', 'metrics.json');

/**
 * Executa comando e retorna output ou default em caso de erro
 * @param {string} cmd - Comando a executar
 * @param {string} [defaultValue=''] - Valor padrão se falhar
 * @returns {string}
 */
function exec(cmd, defaultValue = '') {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return defaultValue;
  }
}

/**
 * Conta melhorias do metrics.json
 * @returns {number}
 */
function getTotalImprovements() {
  try {
    const data = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    return data.totalImprovements || 0;
  } catch {
    return 0;
  }
}

/**
 * Verifica backpressure (PRs abertos)
 * @returns {{count: number, status: string}}
 */
function getBackpressure() {
  const output = exec('gh pr list --state open 2>nul', '');
  const lines = output.split('\n').filter(l => l.trim());
  const count = lines.length;
  
  let status = '🟢';
  if (count >= 9) status = '🔴';
  else if (count >= 6) status = '🟡';
  
  return { count, status };
}

/**
 * Verifica mudanças pendentes no git
 * @returns {number}
 */
function getPendingChanges() {
  const output = exec('git status --short 2>nul', '');
  return output.split('\n').filter(l => l.trim()).length;
}

/**
 * Formata duração em minutos para exibição curta
 * @param {number} minutes 
 * @returns {string}
 */
function formatShortDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
}

/**
 * Modo compacto (padrão) - 1 linha
 */
function compactMode() {
  const improvements = getTotalImprovements();
  const bp = getBackpressure();
  const changes = getPendingChanges();
  
  // Calcula tempo desde última melhoria (aproximado)
  const lastImprovementTime = exec('git log -1 --format=%ct 2>nul', '0');
  const minutesSince = lastImprovementTime !== '0' 
    ? Math.floor((Date.now() / 1000 - parseInt(lastImprovementTime)) / 60)
    : 0;
  
  const parts = [
    `🦊 ${improvements}`,
    minutesSince > 0 ? `${formatShortDuration(minutesSince)}` : null,
    bp.count > 0 ? `${bp.status} ${bp.count}PR` : '🟢',
    changes > 0 ? `💾 ${changes}Δ` : null
  ].filter(Boolean);
  
  console.log(parts.join(' | '));
}

/**
 * Modo emoji-friendly (para plataformas com bom suporte)
 */
function emojiMode() {
  const bp = getBackpressure();
  const changes = getPendingChanges();
  
  if (bp.status === '🟢' && changes === 0) {
    console.log('🟢 Sistema saudável');
  } else {
    const parts = [];
    if (bp.status !== '🟢') parts.push(`${bp.status} ${bp.count} PRs abertos`);
    if (changes > 0) parts.push(`💾 ${changes} mudanças pendentes`);
    console.log(parts.join(' | '));
  }
}

/**
 * Modo JSON (para automação)
 */
function jsonMode() {
  const bp = getBackpressure();
  const changes = getPendingChanges();
  const improvements = getTotalImprovements();
  
  console.log(JSON.stringify({
    improvements,
    backpressure: { count: bp.count, status: bp.status },
    pendingChanges: changes,
    healthy: bp.status === '🟢' && changes === 0,
    timestamp: new Date().toISOString()
  }));
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--json')) {
  jsonMode();
} else if (args.includes('--emoji')) {
  emojiMode();
} else {
  compactMode();
}
