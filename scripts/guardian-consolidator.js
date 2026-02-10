#!/usr/bin/env node
/**
 * @fileoverview Guardian Report Consolidator
 * Consolida relatórios do Guardian em visualização histórica
 * @module scripts/guardian-consolidator
 * @local_improvement - Melhoria #76: Análise de tendências históricas
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const OUTPUT_FILE = path.join(__dirname, 'reports', 'consolidated-trends.json');

/**
 * Carrega todos os relatórios do guardian
 * @returns {Array<Object>} Relatórios carregados
 */
function loadReports() {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('guardian-') && f.endsWith('.json'))
    .sort();
  
  const reports = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      reports.push({
        file,
        date: data.timestamp || file.match(/guardian-(\d{4}-\d{2}-\d{2})/)?.[1],
        ...data
      });
    } catch (e) {
      // Skip invalid files
    }
  }
  return reports;
}

/**
 * Calcula tendências dos últimos N dias
 * @param {Array<Object>} reports - Relatórios
 * @param {number} days - Quantidade de dias
 * @returns {Object} Tendências calculadas
 */
function calculateTrends(reports, days = 7) {
  const recent = reports.slice(-days);
  
  const healthScores = recent.map(r => r.healthScore || r.health?.score || 0).filter(Boolean);
  const avgHealth = healthScores.length ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length : 0;
  
  const prCounts = recent.map(r => r.backpressure?.prCount || r.prCount || 0).filter(n => n > 0);
  const avgPRs = prCounts.length ? prCounts.reduce((a, b) => a + b, 0) / prCounts.length : 0;
  
  const improvements = recent.map(r => r.improvements?.today || r.newImprovements || 0);
  const totalImprovements = improvements.reduce((a, b) => a + b, 0);
  
  return {
    daysAnalyzed: recent.length,
    averageHealth: Math.round(avgHealth),
    averagePRs: Math.round(avgPRs),
    totalImprovements,
    trendDirection: healthScores.length >= 2 
      ? healthScores[healthScores.length - 1] > healthScores[0] ? '📈' : '📉'
      : '➡️',
    healthTrend: healthScores.length >= 2
      ? healthScores[healthScores.length - 1] - healthScores[0]
      : 0
  };
}

/**
 * Formata saída para console
 * @param {Object} trends - Dados de tendências
 */
function formatConsoleOutput(trends) {
  console.log('\n📊 Guardian Trends (Last ' + trends.daysAnalyzed + ' days)');
  console.log('═══════════════════════════════════════');
  console.log(`Health Score: ${trends.averageHealth}/100 ${trends.trendDirection}`);
  console.log(`Health Delta: ${trends.healthTrend > 0 ? '+' : ''}${trends.healthTrend}`);
  console.log(`Avg Open PRs: ${trends.averagePRs}`);
  console.log(`Improvements: ${trends.totalImprovements}`);
  console.log('═══════════════════════════════════════\n');
}

/**
 * Executa consolidação
 */
function main() {
  const reports = loadReports();
  
  if (reports.length === 0) {
    console.log('⚠️ No guardian reports found');
    process.exit(0);
  }
  
  const trends = calculateTrends(reports, 7);
  
  // Save consolidated data
  const consolidated = {
    generatedAt: new Date().toISOString(),
    totalReports: reports.length,
    trends,
    history: reports.map(r => ({
      date: r.date,
      health: r.healthScore || r.health?.score,
      prCount: r.backpressure?.prCount || r.prCount,
      improvements: r.improvements?.today || r.newImprovements
    })).slice(-30)
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(consolidated, null, 2));
  
  formatConsoleOutput(trends);
  console.log(`✅ Consolidated data saved to: ${OUTPUT_FILE}`);
}

main();
