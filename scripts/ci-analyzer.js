#!/usr/bin/env node
// @ts-check
/**
 * @fileoverview CI Analyzer - Analisador de padrões para sugestão inteligente de melhorias
 * Analisa histórico de melhorias e sugere próximos passos baseados em padrões detectados
 * 
 * @author Kaixa Jr
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} ImprovementPattern
 * @property {string} type - Tipo de padrão (category_cycle, time_gap, backlog_priority)
 * @property {string} description - Descrição do padrão detectado
 * @property {number} confidence - Confiança (0-1)
 * @property {string} suggestion - Sugestão de ação
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {number} totalImprovements - Total de melhorias
 * @property {Object.<string, number>} categoryDistribution - Distribuição por categoria
 * @property {number} avgTimeBetween - Tempo médio entre melhorias (min)
 * @property {string} lastCategory - Última categoria melhorada
 * @property {ImprovementPattern[]} patterns - Padrões detectados
 * @property {string} recommendation - Recomendação principal
 */

/**
 * Carrega métricas do arquivo metrics.json
 * @returns {Object|null}
 */
function loadMetrics() {
  const metricsPath = path.join(process.cwd(), 'memory', 'improvements', 'metrics.json');
  if (!fs.existsSync(metricsPath)) return null;
  
  try {
    return JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Carrega tracking do arquivo TRACKING.md
 * @returns {Object|null}
 */
function loadTracking() {
  const trackingPath = path.join(process.cwd(), 'memory', 'improvements', 'TRACKING.md');
  if (!fs.existsSync(trackingPath)) return null;
  
  const content = fs.readFileSync(trackingPath, 'utf-8');
  
  // Extrair métricas básicas
  const totalMatch = content.match(/\*\*Total de melhorias\*\*\s*[:|-]\s*(\d+)/);
  const prMatch = content.match(/PRs criados\s*[:|-]\s*(\d+)/);
  const localMatch = content.match(/Melhorias locais\s*[:|-]\s*(\d+)/);
  
  return {
    total: totalMatch ? parseInt(totalMatch[1]) : 0,
    prs: prMatch ? parseInt(prMatch[1]) : 0,
    locals: localMatch ? parseInt(localMatch[1]) : 0,
    raw: content
  };
}

/**
 * Detecta ciclos de categorias (alternância saudável)
 * @param {Object} metrics
 * @returns {ImprovementPattern|null}
 */
function detectCategoryCycle(metrics) {
  const categories = metrics?.categories || {};
  const entries = Object.entries(categories).filter(([k]) => k !== 'total');
  
  if (entries.length < 2) return null;
  
  const max = Math.max(...entries.map(([, v]) => v));
  const min = Math.min(...entries.map(([, v]) => v));
  const ratio = max > 0 ? min / max : 0;
  
  if (ratio < 0.3) {
    const lowest = entries.find(([, v]) => v === min)?.[0] || 'unknown';
    return {
      type: 'category_cycle',
      description: `Categoria "${lowest}" sub-representada (${min} vs ${max})`,
      confidence: 0.8,
      suggestion: `Priorizar melhorias do tipo: ${lowest}`
    };
  }
  
  return {
    type: 'category_cycle', 
    description: 'Distribuição equilibrada entre categorias',
    confidence: 0.9,
    suggestion: 'Manter ritmo, focar em qualidade'
  };
}

/**
 * Detecta gaps temporais
 * @param {Object} metrics
 * @returns {ImprovementPattern|null}
 */
function detectTimeGap(metrics) {
  if (!metrics?.history?.length) return null;
  
  const lastRuns = metrics.history.slice(-5);
  const timestamps = lastRuns
    .map(r => new Date(r.timestamp).getTime())
    .filter(t => !isNaN(t));
  
  if (timestamps.length < 2) return null;
  
  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push((timestamps[i] - timestamps[i-1]) / (1000 * 60)); // minutos
  }
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  
  if (avgGap > 60) {
    return {
      type: 'time_gap',
      description: `Gap médio de ${Math.round(avgGap)}min entre execuções`,
      confidence: 0.7,
      suggestion: 'Verificar se cron está ativo ou há bloqueios'
    };
  }
  
  return {
    type: 'time_gap',
    description: `Cadência saudável: ${Math.round(avgGap)}min médio`,
    confidence: 0.9,
    suggestion: 'Sistema operando normalmente'
  };
}

/**
 * Detecta prioridade baseada em backlog
 * @param {Object} metrics
 * @returns {ImprovementPattern|null}
 */
function detectBacklogPriority(metrics) {
  const backpressure = metrics?.backpressure;
  if (!backpressure) return null;
  
  const duration = backpressure.duration || 0;
  const status = backpressure.status;
  
  if (status === 'red' && duration > 48) {
    return {
      type: 'backlog_priority',
      description: `Backpressure crítico há ${Math.round(duration)}h`,
      confidence: 0.95,
      suggestion: 'URGENTE: Resolver PRs pendentes ou documentar consolidação'
    };
  }
  
  if (status === 'red') {
    return {
      type: 'backlog_priority',
      description: 'Backpressure ativo',
      confidence: 0.8,
      suggestion: 'Focar em melhorias locais/documentação'
    };
  }
  
  return {
    type: 'backlog_priority',
    description: 'Backlog saudável',
    confidence: 0.9,
    suggestion: 'Liberado para criar novos PRs'
  };
}

/**
 * Analisa histórico e gera recomendação
 * @returns {AnalysisResult}
 */
function analyze() {
  const metrics = loadMetrics();
  const tracking = loadTracking();
  
  const patterns = [
    detectCategoryCycle(metrics),
    detectTimeGap(metrics),
    detectBacklogPriority(metrics)
  ].filter(Boolean);
  
  // Determinar recomendação
  let recommendation = 'Continuar melhorias regulares';
  
  const critical = patterns.find(p => p.confidence > 0.9 && p.type === 'backlog_priority');
  const imbalance = patterns.find(p => p.type === 'category_cycle' && p.confidence < 0.9);
  
  if (critical) {
    recommendation = critical.suggestion;
  } else if (imbalance) {
    recommendation = imbalance.suggestion;
  }
  
  const categories = metrics?.categories || {};
  
  return {
    totalImprovements: tracking?.total || metrics?.totalImprovements || 0,
    categoryDistribution: {
      docs: categories.docs || 0,
      code: categories.code || 0,
      test: categories.test || 0,
      refactor: categories.refactor || 0,
      config: categories.config || 0
    },
    avgTimeBetween: metrics?.throughput ? 60 / metrics.throughput : 0,
    lastCategory: metrics?.lastCategory || 'unknown',
    patterns,
    recommendation
  };
}

/**
 * Formata resultado para exibição
 * @param {AnalysisResult} result
 * @returns {string}
 */
function formatOutput(result) {
  const lines = [
    '📊 CI Analyzer - Análise de Padrões',
    '='.repeat(50),
    '',
    `📈 Total: ${result.totalImprovements} melhorias`,
    `⏱️  Média: ${result.avgTimeBetween.toFixed(1)}min entre melhorias`,
    '',
    '📁 Distribuição:',
    `  📝 Docs: ${result.categoryDistribution.docs}`,
    `  💻 Code: ${result.categoryDistribution.code}`,
    `  🧪 Test: ${result.categoryDistribution.test}`,
    `  ♻️  Refactor: ${result.categoryDistribution.refactor}`,
    `  ⚙️  Config: ${result.categoryDistribution.config}`,
    '',
    '🔍 Padrões Detectados:'
  ];
  
  for (const pattern of result.patterns) {
    const icon = pattern.confidence > 0.8 ? '✅' : '⚠️';
    lines.push(`  ${icon} [${pattern.type}] ${pattern.description}`);
    lines.push(`     → ${pattern.suggestion}`);
  }
  
  lines.push('');
  lines.push('🎯 RECOMENDAÇÃO:');
  lines.push(`   ${result.recommendation}`);
  
  return lines.join('\n');
}

/**
 * Retorna resultado em formato JSON
 * @param {AnalysisResult} result
 * @returns {string}
 */
function formatJSON(result) {
  return JSON.stringify(result, null, 2);
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const isJSON = args.includes('--json');
  const isMini = args.includes('--mini');
  
  const result = analyze();
  
  if (isMini) {
    const status = result.recommendation.substring(0, 50);
    console.log(`🦊 ${result.totalImprovements} | ${status}...`);
    return;
  }
  
  if (isJSON) {
    console.log(formatJSON(result));
    return;
  }
  
  console.log(formatOutput(result));
}

module.exports = { analyze, loadMetrics, loadTracking };

if (require.main === module) {
  main();
}
