#!/usr/bin/env node
/**
 * @fileoverview Backpressure Analyzer - Investiga backpressure persistente e sugere ações
 * @description Analisa PRs abertos, tempo de espera, e sugere estratégias de resolução
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const REPO = 'Kaixadagua/kaixa-jr';
const BACKPRESSURE_THRESHOLD = 9;
const PERSISTENT_HOURS = 48; // Considerado persistente após 48h

/**
 * Executa comando git/gh e retorna stdout
 * @param {string} cmd 
 * @returns {string}
 */
function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Busca PRs abertos
 * @returns {Array<{number: number, title: string, created: string, author: string, branch: string}>}
 */
function fetchOpenPRs() {
  const output = exec(`gh pr list --repo ${REPO} --state open --json number,title,createdAt,author,headRefName --limit 50`);
  if (!output) return [];
  try {
    return JSON.parse(output);
  } catch {
    return [];
  }
}

/**
 * Calcula idade em horas
 * @param {string} createdAt 
 * @returns {number}
 */
function getAgeHours(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  return (now - created) / (1000 * 60 * 60);
}

/**
 * Formata duração
 * @param {number} hours 
 * @returns {string}
 */
function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Categoriza PR por tipo
 * @param {string} title 
 * @returns {string}
 */
function categorizePR(title) {
  const lower = title.toLowerCase();
  if (lower.includes('doc')) return '📄 docs';
  if (lower.includes('test')) return '🧪 test';
  if (lower.includes('fix')) return '🐛 fix';
  if (lower.includes('refactor')) return '♻️ refactor';
  if (lower.includes('feature') || lower.includes('feat')) return '✨ feat';
  return '💻 code';
}

/**
 * Analisa e reporta backpressure
 */
function analyzeBackpressure() {
  console.log(`${COLORS.cyan}🔍 Backpressure Analyzer${COLORS.reset}`);
  console.log(`${COLORS.gray}══════════════════════════════════════════════════${COLORS.reset}\n`);

  const prs = fetchOpenPRs();
  
  if (prs.length === 0) {
    console.log(`${COLORS.green}✅ Nenhum PR aberto. Backpressure inativo.${COLORS.reset}`);
    return { status: 'green', prs: 0, actions: [] };
  }

  // Análise
  const analysis = {
    total: prs.length,
    byType: {},
    byAge: { fresh: 0, aging: 0, stale: 0 },
    oldest: null,
    newest: null
  };

  let maxAge = 0;
  let minAge = Infinity;

  prs.forEach(pr => {
    const age = getAgeHours(pr.created);
    const type = categorizePR(pr.title);
    
    analysis.byType[type] = (analysis.byType[type] || 0) + 1;
    
    if (age < 24) analysis.byAge.fresh++;
    else if (age < PERSISTENT_HOURS) analysis.byAge.aging++;
    else analysis.byAge.stale++;

    if (age > maxAge) {
      maxAge = age;
      analysis.oldest = { ...pr, age };
    }
    if (age < minAge) {
      minAge = age;
      analysis.newest = { ...pr, age };
    }
  });

  // Status
  const status = prs.length >= BACKPRESSURE_THRESHOLD ? 'red' : 
                 prs.length >= 6 ? 'yellow' : 'green';
  
  const statusEmoji = status === 'red' ? '🔴' : status === 'yellow' ? '🟡' : '🟢';
  const statusColor = status === 'red' ? COLORS.red : status === 'yellow' ? COLORS.yellow : COLORS.green;

  console.log(`${statusColor}${statusEmoji} Status: ${prs.length}/${BACKPRESSURE_THRESHOLD} PRs${COLORS.reset}`);
  
  if (analysis.oldest) {
    const persistent = maxAge > PERSISTENT_HOURS;
    const pColor = persistent ? COLORS.red : COLORS.yellow;
    console.log(`${pColor}⏱️  Mais antigo: #${analysis.oldest.number} (${formatDuration(maxAge)})${COLORS.reset}`);
    if (persistent) {
      console.log(`${COLORS.red}   ⚠️  BACKPRESSURE PERSISTENTE (${formatDuration(maxAge)})${COLORS.reset}`);
    }
  }
  console.log();

  // Distribuição por tipo
  console.log(`${COLORS.cyan}📊 Distribuição por Tipo:${COLORS.reset}`);
  Object.entries(analysis.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`   ${type.padEnd(12)} ${String(count).padStart(2)} ${bar}`);
    });
  console.log();

  // Distribuição por idade
  console.log(`${COLORS.cyan}⏰ Distribuição por Idade:${COLORS.reset}`);
  console.log(`   🟢 <24h:      ${analysis.byAge.fresh}`);
  console.log(`   🟡 24-48h:    ${analysis.byAge.aging}`);
  console.log(`   🔴 >48h:      ${analysis.byAge.stale}`);
  console.log();

  // Ações sugeridas
  console.log(`${COLORS.cyan}💡 Ações Sugeridas:${COLORS.reset}`);
  const actions = [];

  if (analysis.byAge.stale > 0) {
    console.log(`${COLORS.red}   1. URGENTE: ${analysis.byAge.stale} PRs estagnados >48h${COLORS.reset}`);
    console.log(`      → Verificar se JUP (reviewer) está disponível`);
    console.log(`      → Considerar auto-merge para docs/testes`);
    actions.push('check_reviewer');
  }

  if (prs.length >= BACKPRESSURE_THRESHOLD) {
    console.log(`   2. Modo backpressure: fazer melhorias locais apenas`);
    actions.push('local_only');
  }

  const docsTests = (analysis.byType['📄 docs'] || 0) + (analysis.byType['🧪 test'] || 0);
  if (docsTests > 3) {
    console.log(`   3. ${docsTests} PRs são docs/testes → candidatos a auto-merge`);
    actions.push('auto_merge_candidates');
  }

  if (analysis.byAge.fresh > 5) {
    console.log(`   4. ${analysis.byAge.fresh} PRs novos (<24h) → cadência alta, reduzir`);
    actions.push('reduce_cadence');
  }

  console.log();

  // Salvar análise
  const reportDir = path.join(process.cwd(), 'memory/reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    repo: REPO,
    totalPRs: prs.length,
    status,
    analysis,
    actions,
    prs: prs.map(p => ({
      number: p.number,
      title: p.title,
      age: getAgeHours(p.created),
      type: categorizePR(p.title)
    }))
  };

  const reportPath = path.join(reportDir, `backpressure-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${COLORS.gray}💾 Report salvo: ${reportPath}${COLORS.reset}`);

  return { status, prs: prs.length, actions, analysis };
}

// Execução principal
if (require.main === module) {
  const result = analyzeBackpressure();
  
  // Exit code para automação
  process.exit(result.status === 'red' ? 2 : result.status === 'yellow' ? 1 : 0);
}

module.exports = { analyzeBackpressure, fetchOpenPRs, categorizePR };
