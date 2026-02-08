#!/usr/bin/env node
/**
 * improvement-metrics.js
 * 
 * Calcula e exibe métricas do sistema de melhorias contínuas.
 * Gerado automaticamente em 2026-02-08.
 * 
 * @module scripts/reports/improvement-metrics
 */

const fs = require('fs');
const path = require('path');

/**
 * Diretório base de melhorias
 * @constant {string}
 */
const IMPROVEMENTS_DIR = path.join(process.cwd(), 'memory', 'improvements');

/**
 * Calcula métricas das melhorias
 * @returns {Object} Métricas calculadas
 */
function calculateMetrics() {
  const files = fs.readdirSync(IMPROVEMENTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'TRACKING.md')
    .map(f => ({
      name: f,
      path: path.join(IMPROVEMENTS_DIR, f),
      content: fs.readFileSync(path.join(IMPROVEMENTS_DIR, f), 'utf8')
    }));

  const metrics = {
    total: files.length,
    byType: {},
    byDate: {},
    linesAdded: 0
  };

  for (const file of files) {
    // Detecta tipo pela categoria no conteúdo
    const typeMatch = file.content.match(/## Categoria\s*\n[📝🧪🔧⚙️💻]+\s*(\w+)/);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'unknown';
    metrics.byType[type] = (metrics.byType[type] || 0) + 1;

    // Extrai data do nome do arquivo
    const dateMatch = file.name.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      metrics.byDate[date] = (metrics.byDate[date] || 0) + 1;
    }

    // Conta linhas adicionadas
    const linesMatch = file.content.match(/\+(\d+)\s*linhas?/);
    if (linesMatch) {
      metrics.linesAdded += parseInt(linesMatch[1], 10);
    }
  }

  return metrics;
}

/**
 * Formata métricas para exibição
 * @param {Object} metrics - Métricas calculadas
 * @returns {string} Saída formatada
 */
function formatMetrics(metrics) {
  const lines = [
    '🦊 KAIXA JR - Improvement Metrics',
    '=' .repeat(40),
    '',
    `📊 Total de melhorias: ${metrics.total}`,
    `📈 Linhas adicionadas: ${metrics.linesAdded}`,
    '',
    '📁 Por Tipo:'
  ];

  for (const [type, count] of Object.entries(metrics.byType).sort((a, b) => b[1] - a[1])) {
    const emoji = type === 'docs' ? '📝' : type === 'test' ? '🧪' : type === 'refactor' ? '🔧' : type === 'config' ? '⚙️' : '💻';
    lines.push(`  ${emoji} ${type}: ${count}`);
  }

  lines.push('', '📅 Por Data (últimos 7 dias):');
  const dates = Object.entries(metrics.byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);
  
  for (const [date, count] of dates) {
    lines.push(`  📆 ${date}: ${count} melhoria(s)`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Executa cálculo e exibe resultado
 */
function run() {
  try {
    if (!fs.existsSync(IMPROVEMENTS_DIR)) {
      console.log('❌ Diretório de melhorias não encontrado');
      process.exit(1);
    }

    const metrics = calculateMetrics();
    console.log(formatMetrics(metrics));
    
    // Retorna JSON para uso programático
    if (process.argv.includes('--json')) {
      console.log('\n---JSON---');
      console.log(JSON.stringify(metrics, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  run();
}

module.exports = { calculateMetrics, formatMetrics };
