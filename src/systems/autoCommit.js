/**
 * Kaixa Jr Auto Commit
 * Auxilia commits com mensagens sugeridas e verificações
 * 
 * @module src/systems/autoCommit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get git status
 * @returns {Object} Status information
 */
function getStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const files = status.trim().split('\n').filter(Boolean);
    
    return {
      hasChanges: files.length > 0,
      files: files.map(line => ({
        status: line.substring(0, 2).trim(),
        file: line.substring(3).trim()
      }))
    };
  } catch (e) {
    return { hasChanges: false, files: [], error: e.message };
  }
}

/**
 * Suggest commit message based on changes
 * @param {Array} files
 * @returns {string} Suggested message
 */
function suggestMessage(files) {
  const hasNew = files.some(f => f.status === 'A' || f.status === '??');
  const hasMod = files.some(f => f.status === 'M');
  const hasDel = files.some(f => f.status === 'D');
  
  const types = [];
  if (hasNew) types.push('add');
  if (hasMod) types.push('update');
  if (hasDel) types.push('remove');
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  if (types.length === 1) {
    return `[kaixa-${date}] ${types[0]}: ${files.length} file(s)`;
  }
  
  return `[kaixa-${date}] ${types.join('/')}: ${files.length} files`;
}

/**
 * Check backpressure before commit
 * @returns {Object} Backpressure status
 */
function checkBackpressure() {
  try {
    // This would integrate with actual backpressure check
    // For now, return placeholder
    return {
      canProceed: true,
      count: 0,
      status: 'green'
    };
  } catch (e) {
    return { canProceed: true, error: e.message };
  }
}

/**
 * Main auto commit function
 * @param {Object} options
 */
function autoCommit(options = {}) {
  console.log('🔍 Checking repository status...\n');
  
  const status = getStatus();
  
  if (!status.hasChanges) {
    console.log('✅ No changes to commit');
    return { committed: false, reason: 'no_changes' };
  }
  
  console.log(`Found ${status.files.length} changed file(s):`);
  status.files.forEach(f => {
    console.log(`  ${f.status.padEnd(2)} ${f.file}`);
  });
  console.log();
  
  // Check backpressure
  const bp = checkBackpressure();
  if (!bp.canProceed && !options.force) {
    console.log('⚠️  Backpressure active - commit blocked');
    console.log('Use --force to override or wait for clearance');
    return { committed: false, reason: 'backpressure' };
  }
  
  // Suggest message
  const message = options.message || suggestMessage(status.files);
  console.log(`💡 Suggested message: "${message}"`);
  
  if (options.dryRun) {
    console.log('\n📝 Dry run - no changes made');
    return { committed: false, reason: 'dry_run', message };
  }
  
  // Stage and commit
  try {
    execSync('git add .');
    execSync(`git commit -m "${message}"`);
    console.log('\n✅ Commit successful!');
    return { committed: true, message };
  } catch (e) {
    console.error('\n❌ Commit failed:', e.message);
    return { committed: false, reason: 'error', error: e.message };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    message: args.find((a, i) => args[i - 1] === '-m' || args[i - 1] === '--message'),
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    force: args.includes('--force') || args.includes('-f')
  };
  
  autoCommit(options);
}

module.exports = { autoCommit, getStatus, suggestMessage, checkBackpressure };
