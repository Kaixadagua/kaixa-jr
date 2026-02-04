/**
 * Kaixa Jr Health Check
 * Verifica saúde do ambiente de forma rápida
 * 
 * @module src/systems/healthCheck
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Execute health check
 * @returns {Object} Health status
 */
function checkHealth() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Check Node.js version
  try {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    results.checks.node = {
      status: major >= 18 ? 'ok' : 'warning',
      version: nodeVersion,
      message: major >= 18 ? 'Node.js OK' : 'Node.js < 18 recommended'
    };
  } catch (e) {
    results.checks.node = { status: 'error', message: e.message };
  }
  
  // Check Git
  try {
    execSync('git --version', { stdio: 'pipe' });
    results.checks.git = { status: 'ok', message: 'Git available' };
  } catch (e) {
    results.checks.git = { status: 'error', message: 'Git not found' };
  }
  
  // Check directories
  const dirs = ['src', 'scripts', 'memory', 'tests'];
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    results.checks[`dir_${dir}`] = {
      status: fs.existsSync(dirPath) ? 'ok' : 'warning',
      message: fs.existsSync(dirPath) ? `${dir}/ exists` : `${dir}/ missing`
    };
  });
  
  // Check .env
  const envPath = path.join(process.cwd(), '.env');
  results.checks.env = {
    status: fs.existsSync(envPath) ? 'ok' : 'warning',
    message: fs.existsSync(envPath) ? '.env exists' : '.env missing (use .env.example)'
  };
  
  // Overall status
  const errors = Object.values(results.checks).filter(c => c.status === 'error').length;
  const warnings = Object.values(results.checks).filter(c => c.status === 'warning').length;
  
  results.overall = errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok';
  results.summary = {
    total: Object.keys(results.checks).length,
    ok: Object.values(results.checks).filter(c => c.status === 'ok').length,
    warning: warnings,
    error: errors
  };
  
  return results;
}

/**
 * Display health report
 * @param {Object} results
 */
function displayReport(results) {
  console.log('\n🏥 Health Check Report\n');
  console.log('═'.repeat(50));
  
  Object.entries(results.checks).forEach(([name, check]) => {
    const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${name.padEnd(20)} ${check.message}`);
  });
  
  console.log('═'.repeat(50));
  console.log(`\nOverall: ${results.overall.toUpperCase()}`);
  console.log(`Passed: ${results.summary.ok}/${results.summary.total}\n`);
}

// Run if called directly
if (require.main === module) {
  const results = checkHealth();
  displayReport(results);
  process.exit(results.overall === 'error' ? 1 : 0);
}

module.exports = { checkHealth, displayReport };
