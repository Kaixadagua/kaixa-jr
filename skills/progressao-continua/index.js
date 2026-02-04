/**
 * Progressão Contínua Skill
 * Gerencia o ciclo de melhoria contínua
 * 
 * @module skills/progressao-continua
 */

const fs = require('fs');
const path = require('path');

/**
 * Get improvement directories
 * @returns {Object} Improvement stats
 */
function getImprovementStats() {
  const improvementsDir = path.join(process.cwd(), 'memory', 'improvements');
  
  if (!fs.existsSync(improvementsDir)) {
    return { count: 0, files: [] };
  }
  
  const files = fs.readdirSync(improvementsDir).filter(f => f.endsWith('.md'));
  
  // Group by date
  const byDate = {};
  files.forEach(file => {
    const date = file.substring(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(file);
  });
  
  // Group by type
  const byType = { code: 0, docs: 0, config: 0, infra: 0, other: 0 };
  files.forEach(file => {
    const content = fs.readFileSync(path.join(improvementsDir, file), 'utf8');
    if (content.includes('💻 Código')) byType.code++;
    else if (content.includes('📝 Docs')) byType.docs++;
    else if (content.includes('⚙️ Config')) byType.config++;
    else if (content.includes('🛡️ Infra')) byType.infra++;
    else byType.other++;
  });
  
  return {
    count: files.length,
    files,
    byDate,
    byType
  };
}

/**
 * Generate improvement report
 * @returns {Object} Report
 */
function generateReport() {
  const stats = getImprovementStats();
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: stats.count,
      today: stats.byDate[new Date().toISOString().slice(0, 10)]?.length || 0
    },
    breakdown: stats.byType,
    timeline: Object.entries(stats.byDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .map(([date, files]) => ({
        date,
        count: files.length
      })),
    cadence: calculateCadence(stats)
  };
}

/**
 * Calculate improvement cadence
 * @param {Object} stats
 * @returns {Object} Cadence metrics
 */
function calculateCadence(stats) {
  const dates = Object.keys(stats.byDate).sort();
  
  if (dates.length < 2) {
    return { averagePerDay: stats.count, trend: 'stable' };
  }
  
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
  
  const averagePerDay = stats.count / daysDiff;
  
  // Calculate trend
  const recent = dates.slice(-3).reduce((sum, d) => sum + stats.byDate[d].length, 0);
  const previous = dates.slice(-6, -3).reduce((sum, d) => sum + (stats.byDate[d]?.length || 0), 0);
  
  let trend = 'stable';
  if (recent > previous * 1.2) trend = 'increasing';
  if (recent < previous * 0.8) trend = 'decreasing';
  
  return {
    averagePerDay: averagePerDay.toFixed(2),
    trend,
    totalDays: Math.ceil(daysDiff)
  };
}

/**
 * Check if improvement should be made
 * @returns {Object} Recommendation
 */
function shouldImprove() {
  const stats = getImprovementStats();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = stats.byDate[today]?.length || 0;
  
  return {
    shouldImprove: todayCount < 5, // Target: 5 improvements per day
    todayCount,
    target: 5,
    remaining: Math.max(0, 5 - todayCount),
    message: todayCount >= 5 
      ? '✅ Daily target reached!' 
      : `🎯 ${5 - todayCount} more improvements to reach daily target`
  };
}

/**
 * Get next improvement suggestion
 * @returns {Object} Suggestion
 */
function getNextSuggestion() {
  const stats = getImprovementStats();
  
  // Find type with least improvements
  const minType = Object.entries(stats.byType)
    .sort((a, b) => a[1] - b[1])[0];
  
  const suggestions = {
    code: 'Implement new feature or refactor existing code',
    docs: 'Add or improve documentation',
    config: 'Update configuration or tooling',
    infra: 'Improve infrastructure or monitoring',
    other: 'General improvements'
  };
  
  return {
    type: minType[0],
    count: minType[1],
    suggestion: suggestions[minType[0]]
  };
}

/**
 * Run skill
 */
function run() {
  const report = generateReport();
  const should = shouldImprove();
  const next = getNextSuggestion();
  
  console.log('\n🔄 Progressão Contínua\n');
  console.log('═'.repeat(50));
  
  console.log(`\n📊 Total de melhorias: ${report.summary.total}`);
  console.log(`📅 Hoje: ${report.summary.today}`);
  
  console.log('\n📈 Por tipo:');
  Object.entries(report.breakdown).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n📊 Cadência:');
  console.log(`  Média: ${report.cadence.averagePerDay}/dia`);
  console.log(`  Tendência: ${report.cadence.trend}`);
  
  console.log(`\n${should.message}`);
  
  console.log('\n💡 Próxima sugestão:');
  console.log(`  Tipo: ${next.type}`);
  console.log(`  Ação: ${next.suggestion}`);
  
  console.log('═'.repeat(50) + '\n');
  
  return {
    report,
    should,
    next
  };
}

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = {
  run,
  getImprovementStats,
  generateReport,
  calculateCadence,
  shouldImprove,
  getNextSuggestion
};
