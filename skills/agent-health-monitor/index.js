/**
 * Agent Health Monitor Skill
 * Monitora saúde de agentes e sessões
 * 
 * @module skills/agent-health-monitor
 */

const { execSync } = require('child_process');

/**
 * Get active sessions
 * @returns {Array} Active sessions
 */
function getActiveSessions() {
  try {
    const result = execSync('openclaw sessions list --json 2>nul || echo "[]"', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    let sessions = [];
    try {
      sessions = JSON.parse(result || '[]');
      if (!Array.isArray(sessions)) sessions = [];
    } catch {
      sessions = [];
    }
    
    return sessions;
  } catch (e) {
    return [];
  }
}

/**
 * Calculate health metrics
 * @param {Array} sessions
 * @returns {Object} Health metrics
 */
function calculateHealth(sessions) {
  const now = Date.now();
  const maxInactive = 60 * 60 * 1000; // 1 hour
  
  const active = sessions.filter(s => {
    const lastActive = new Date(s.lastActive).getTime();
    return (now - lastActive) < maxInactive;
  });
  
  const inactive = sessions.filter(s => {
    const lastActive = new Date(s.lastActive).getTime();
    return (now - lastActive) >= maxInactive;
  });
  
  const totalTokens = sessions.reduce((sum, s) => sum + (s.tokens || 0), 0);
  
  return {
    total: sessions.length,
    active: active.length,
    inactive: inactive.length,
    totalTokens,
    status: inactive.length > 0 ? 'warning' : 'healthy'
  };
}

/**
 * Generate health report
 * @returns {Object} Health report
 */
function generateReport() {
  const sessions = getActiveSessions();
  const health = calculateHealth(sessions);
  
  return {
    timestamp: new Date().toISOString(),
    sessions: {
      total: health.total,
      active: health.active,
      inactive: health.inactive,
      list: sessions.map(s => ({
        id: s.sessionKey,
        kind: s.kind,
        lastActive: s.lastActive,
        tokens: s.tokens
      }))
    },
    metrics: {
      totalTokens: health.totalTokens,
      status: health.status
    },
    recommendations: generateRecommendations(health)
  };
}

/**
 * Generate recommendations
 * @param {Object} health
 * @returns {Array} Recommendations
 */
function generateRecommendations(health) {
  const recommendations = [];
  
  if (health.inactive > 0) {
    recommendations.push({
      type: 'cleanup',
      message: `${health.inactive} sessões inativas detectadas`,
      action: 'Considerar limpeza de sessões antigas'
    });
  }
  
  if (health.totalTokens > 300000) {
    recommendations.push({
      type: 'memory',
      message: 'Uso de tokens elevado',
      action: 'Executar flush de contexto'
    });
  }
  
  if (health.total > 2) {
    recommendations.push({
      type: 'scaling',
      message: 'Múltiplos agentes ativos',
      action: 'Verificar se todos são necessários'
    });
  }
  
  return recommendations;
}

/**
 * Run health check and display
 */
function run() {
  const report = generateReport();
  
  console.log('\n🏥 Agent Health Monitor\n');
  console.log('═'.repeat(50));
  console.log(`\nSessões: ${report.sessions.active} ativas, ${report.sessions.inactive} inativas`);
  console.log(`Tokens: ${report.metrics.totalTokens.toLocaleString()}`);
  console.log(`Status: ${report.metrics.status === 'healthy' ? '✅ Saudável' : '⚠️ Atenção'}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recomendações:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.type.toUpperCase()}] ${rec.message}`);
      console.log(`     → ${rec.action}`);
    });
  }
  
  console.log('═'.repeat(50) + '\n');
  
  return report;
}

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = { run, getActiveSessions, calculateHealth, generateReport, generateRecommendations };
