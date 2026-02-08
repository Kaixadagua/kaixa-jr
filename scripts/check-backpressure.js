#!/usr/bin/env node
/**
 * @fileoverview Check Backpressure - Script cross-platform para verificar backlog de PRs
 * @description Funciona em Windows, Linux e macOS sem depender de comandos shell específicos
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/check-backpressure.js [--json]
 */

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Configuração de thresholds
 * @constant {Object}
 */
const CONFIG = {
  thresholds: {
    green: 5,
    yellow: 8,
    red: 9
  }
};

/**
 * Executa comando gh e retorna output
 * @param {string[]} args - Argumentos para gh
 * @returns {string|null} Output ou null em erro
 */
function gh(args) {
  try {
    return execSync(`gh ${args.join(' ')}`, { 
      encoding: 'utf8',
      timeout: 15000 
    });
  } catch (e) {
    return null;
  }
}

/**
 * Conta PRs abertos via gh CLI
 * @returns {number} Quantidade de PRs abertos (-1 se erro)
 */
function countOpenPRs() {
  const output = gh(['pr', 'list', '--state', 'open', '--json', 'number']);
  if (!output) return -1;
  
  try {
    const prs = JSON.parse(output);
    return Array.isArray(prs) ? prs.length : 0;
  } catch {
    return -1;
  }
}

/**
 * Obtém o PR mais antigo
 * @returns {Object|null} Dados do PR mais antigo
 */
function getOldestPR() {
  const output = gh(['pr', 'list', '--state', 'open', '--json', 'number,title,createdAt', '--limit', '100']);
  if (!output) return null;
  
  try {
    const prs = JSON.parse(output);
    if (!prs.length) return null;
    
    // Ordena por data (mais antigo primeiro)
    prs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return prs[0];
  } catch {
    return null;
  }
}

/**
 * Determina status baseado na contagem
 * @param {number} count - Quantidade de PRs
 * @returns {string} Status: 'green'|'yellow'|'red'
 */
function getStatus(count) {
  if (count < 0) return 'unknown';
  if (count >= CONFIG.thresholds.red) return 'red';
  if (count >= CONFIG.thresholds.yellow) return 'yellow';
  return 'green';
}

/**
 * Formata duração em horas/minutos
 * @param {string} dateStr - Data ISO
 * @returns {string} Duração formatada
 */
function formatDuration(dateStr) {
  const created = new Date(dateStr);
  const now = new Date();
  const hours = Math.floor((now - created) / (1000 * 60 * 60));
  
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/**
 * Modo JSON: output estruturado
 * @returns {Object} Dados de backpressure
 */
function jsonMode() {
  const count = countOpenPRs();
  const oldest = getOldestPR();
  const status = getStatus(count);
  
  return {
    count,
    status,
    backpressure: status === 'red',
    warning: status === 'yellow',
    thresholds: CONFIG.thresholds,
    oldest: oldest ? {
      number: oldest.number,
      title: oldest.title,
      age: formatDuration(oldest.createdAt)
    } : null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Modo visual: output formatado para humanos
 */
function visualMode() {
  const count = countOpenPRs();
  const status = getStatus(count);
  const oldest = getOldestPR();
  
  const icons = {
    green: '🟢',
    yellow: '🟡',
    red: '🔴',
    unknown: '⚪'
  };
  
  const labels = {
    green: 'OK - Fluxo normal',
    yellow: 'Atenção - Próximo do limite',
    red: 'BACKPRESSURE - Limite excedido',
    unknown: 'Desconhecido - Erro na verificação'
  };
  
  console.log('\n📊 Backpressure Status\n');
  console.log('─'.repeat(50));
  console.log(`${icons[status]} Status: ${labels[status]}`);
  console.log(`   PRs abertos: ${count >= 0 ? count : 'N/A'}`);
  console.log(`   Limite: ${CONFIG.thresholds.red}+ = backpressure`);
  
  if (oldest) {
    console.log(`\n⏱️  PR mais antigo: #${oldest.number}`);
    console.log(`   "${oldest.title}"`);
    console.log(`   Idade: ${formatDuration(oldest.createdAt)}`);
  }
  
  if (status === 'red') {
    console.log('\n⚠️  BACKPRESSURE ATIVO');
    console.log('   → Fazer melhorias locais/documentação');
    console.log('   → Não criar novos PRs até count < 9');
  } else if (status === 'yellow') {
    console.log('\n💡 Próximo do limite - priorizar merges');
  }
  
  console.log('─'.repeat(50));
  console.log();
}

/**
 * Função principal
 */
function main() {
  const isJson = process.argv.includes('--json');
  
  if (isJson) {
    console.log(JSON.stringify(jsonMode(), null, 2));
  } else {
    visualMode();
  }
}

main();
