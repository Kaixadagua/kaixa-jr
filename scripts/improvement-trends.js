#!/usr/bin/env node
/**
 * @fileoverview Improvement Trends Analyzer
 * Analyzes improvement metrics and generates trend insights
 * @module scripts/improvement-trends
 * @author Kaixa Jr
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} ImprovementEntry
 * @property {string} timestamp - ISO timestamp
 * @property {boolean} success - Whether the improvement succeeded
 * @property {string} type - Type of improvement
 * @property {string} file - File affected
 * @property {number} lines - Lines changed
 * @property {boolean} local - Whether it was a local improvement
 */

/**
 * @typedef {Object} TrendAnalysis
 * @property {string} period - Analysis period
 * @property {number} totalImprovements - Total count
 * @property {number} localRatio - Ratio of local improvements
 * @property {string} dominantType - Most common improvement type
 * @property {number} avgLinesPerImprovement - Average lines changed
 * @property {string[]} insights - Generated insights
 */

/**
 * Load metrics data
 * @returns {Object|null} Parsed metrics or null if error
 */
function loadMetrics() {
  try {
    const metricsPath = path.join(process.cwd(), 'memory/improvements/metrics.json');
    const data = fs.readFileSync(metricsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

/**
 * Calculate trend statistics
 * @param {ImprovementEntry[]} history - History entries
 * @returns {TrendAnalysis} Trend analysis
 */
function calculateTrends(history) {
  if (!history || history.length === 0) {
    return {
      period: 'N/A',
      totalImprovements: 0,
      localRatio: 0,
      dominantType: 'none',
      avgLinesPerImprovement: 0,
      insights: ['No data available']
    };
  }

  // Type distribution
  const typeCounts = {};
  let totalLines = 0;
  let localCount = 0;

  for (const entry of history) {
    typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
    totalLines += entry.lines || 0;
    if (entry.local) localCount++;
  }

  // Find dominant type
  const dominantType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  // Calculate period
  const timestamps = history.map(h => new Date(h.timestamp));
  const oldest = new Date(Math.min(...timestamps));
  const newest = new Date(Math.max(...timestamps));
  const daysDiff = Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24));

  // Generate insights
  const insights = [];
  
  const localRatio = localCount / history.length;
  if (localRatio > 0.5) {
    insights.push(`📦 Backpressure active: ${(localRatio * 100).toFixed(0)}% local improvements`);
  }
  
  if (dominantType === 'docs') {
    insights.push('📝 Documentation-focused period detected');
  } else if (dominantType === 'code') {
    insights.push('💻 Code-focused period detected');
  } else if (dominantType === 'refactor') {
    insights.push('♻️ Refactoring-focused period detected');
  }

  const avgLines = totalLines / history.length;
  if (avgLines < 20) {
    insights.push('⚡ Incremental improvements (small changes)');
  } else if (avgLines > 100) {
    insights.push('🏗️ Large-scale improvements detected');
  }

  if (daysDiff > 0) {
    const rate = history.length / daysDiff;
    if (rate > 10) {
      insights.push('🚀 High velocity period (>10 improvements/day)');
    } else if (rate < 2) {
      insights.push('🐢 Low velocity period (<2 improvements/day)');
    }
  }

  return {
    period: daysDiff > 0 ? `${daysDiff} days` : 'single day',
    totalImprovements: history.length,
    localRatio,
    dominantType,
    avgLinesPerImprovement: Math.round(avgLines),
    insights
  };
}

/**
 * Format trend report
 * @param {TrendAnalysis} trends - Trend analysis
 * @returns {string} Formatted report
 */
function formatReport(trends) {
  const lines = [
    '📈 Improvement Trends Analysis',
    '═══════════════════════════════════════════════',
    '',
    `📊 Period: ${trends.period}`,
    `🔢 Total: ${trends.totalImprovements} improvements`,
    `📦 Local ratio: ${(trends.localRatio * 100).toFixed(0)}%`,
    `🏷️  Dominant type: ${trends.dominantType}`,
    `📏 Avg lines: ${trends.avgLinesPerImprovement}`,
    '',
    '💡 Insights:',
    ...trends.insights.map(i => `   ${i}`),
    '',
    '═══════════════════════════════════════════════'
  ];
  return lines.join('\n');
}

/**
 * Main function
 * @returns {Promise<void>}
 */
async function main() {
  const metrics = loadMetrics();
  
  if (!metrics) {
    console.error('❌ Failed to load metrics.json');
    process.exit(1);
  }

  const trends = calculateTrends(metrics.history || []);
  console.log(formatReport(trends));
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { loadMetrics, calculateTrends, formatReport };
