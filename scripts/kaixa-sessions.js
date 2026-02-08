#!/usr/bin/env node
/**
 * kaixa-sessions.js - Listador de sessões ativas do OpenClaw
 * 
 * Exibe sessões ativas de forma amigável com:
 * - Contagem de sessões por tipo
 * - Tempo desde última atividade
 * - Status de saúde
 * 
 * Uso: node scripts/kaixa-sessions.js
 */

const { execSync } = require('child_process');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function color(name, text) {
  return `${COLORS[name] || ''}${text}${COLORS.reset}`;
}

function printHeader() {
  console.log('\n' + color('bright', '🦊 Sessões Ativas - Kaixa Jr'));
  console.log(color('dim', '─'.repeat(50)));
}

function parseSessionLine(line) {
  // Formato esperado: id | kind | label | lastMessage | activeMinutes
  const parts = line.split('|').map(p => p.trim());
  return {
    id: parts[0] || 'unknown',
    kind: parts[1] || 'unknown',
    label: parts[2] || '',
    lastMessage: parts[3] || '',
    activeMinutes: parseInt(parts[4]) || 0
  };
}

function getStatusEmoji(activeMinutes) {
  if (activeMinutes < 5) return color('green', '●');
  if (activeMinutes < 30) return color('yellow', '●');
  return color('red', '●');
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function listSessions() {
  try {
    // Tenta obter sessões via comando openclaw
    const output = execSync('openclaw sessions list --limit 20 2>nul', { 
      encoding: 'utf8',
      timeout: 5000
    });
    
    const lines = output.trim().split('\n').filter(l => l.includes('|'));
    
    if (lines.length === 0) {
      console.log(color('yellow', '  ⚠️  Nenhuma sessão ativa encontrada'));
      return { total: 0, byKind: {} };
    }

    const sessions = lines.map(parseSessionLine);
    const byKind = {};
    
    sessions.forEach(s => {
      byKind[s.kind] = (byKind[s.kind] || 0) + 1;
    });

    // Lista detalhada
    sessions.forEach(s => {
      const status = getStatusEmoji(s.activeMinutes);
      const duration = formatDuration(s.activeMinutes);
      const label = s.label ? color('dim', ` (${s.label})`) : '';
      const kind = color('cyan', s.kind.padEnd(12));
      
      console.log(`  ${status} ${kind} ${color('dim', duration.padStart(6))}${label}`);
    });

    return { total: sessions.length, byKind };
    
  } catch (error) {
    // Fallback: simula dados para demonstração
    console.log(color('dim', '  (modo simulação - openclaw CLI não disponível)'));
    console.log(`  ${color('green', '●')} ${color('cyan', 'main'.padEnd(12))} ${color('dim', '2m'.padStart(6))} ${color('dim', '(Kaixa Jr)')}`);
    console.log(`  ${color('yellow', '●')} ${color('cyan', 'subagent'.padEnd(12))} ${color('dim', '15m'.padStart(6))}`);
    
    return { 
      total: 2, 
      byKind: { main: 1, subagent: 1 },
      simulated: true 
    };
  }
}

function printStats(stats) {
  console.log('\n' + color('bright', '📊 Estatísticas'));
  console.log(color('dim', '─'.repeat(30)));
  console.log(`  Total: ${color('bright', stats.total)} sessão(ões)`);
  
  Object.entries(stats.byKind).forEach(([kind, count]) => {
    const bar = '█'.repeat(Math.min(count, 10));
    console.log(`  ${kind.padEnd(12)} ${color('blue', bar)} ${count}`);
  });
  
  if (stats.simulated) {
    console.log(color('dim', '\n  ⚠️  Dados simulados - instale openclaw CLI para dados reais'));
  }
}

function main() {
  printHeader();
  const stats = listSessions();
  printStats(stats);
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { listSessions, formatDuration };
