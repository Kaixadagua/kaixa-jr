/**
 * Kaixa Jr Repository Initialization
 * Initialize and organize repository structure
 * 
 * @module src/systems/repoInit
 */

const fs = require('fs');
const path = require('path');

/**
 * Required directory structure
 */
const REQUIRED_DIRS = [
  'src/core',
  'src/systems',
  'src/utils',
  'scripts/health',
  'scripts/reports',
  'scripts/sync',
  'docs/architecture',
  'docs/guides',
  'docs/api',
  'tests/core',
  'tests/systems',
  'tests/utils',
  'memory/improvements',
  'config',
  'skills',
  'logs',
  'backups'
];

/**
 * Check if directory exists
 * @param {string} dir
 * @returns {boolean}
 */
function dirExists(dir) {
  return fs.existsSync(path.join(process.cwd(), dir));
}

/**
 * Create directory if not exists
 * @param {string} dir
 */
function createDir(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created: ${dir}/`);
    return true;
  }
  console.log(`  ✓ Exists: ${dir}/`);
  return false;
}

/**
 * Initialize repository structure
 * @returns {Object} Initialization results
 */
function initRepo() {
  console.log('\n🏗️  Repository Initialization\n');
  console.log('═'.repeat(50));
  
  const results = {
    created: [],
    existing: [],
    errors: []
  };
  
  REQUIRED_DIRS.forEach(dir => {
    try {
      if (createDir(dir)) {
        results.created.push(dir);
      } else {
        results.existing.push(dir);
      }
    } catch (e) {
      results.errors.push({ dir, error: e.message });
      console.log(`  ❌ Error: ${dir}/ - ${e.message}`);
    }
  });
  
  console.log('═'.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`  Created: ${results.created.length}`);
  console.log(`  Existing: ${results.existing.length}`);
  console.log(`  Errors: ${results.errors.length}`);
  
  if (results.created.length > 0) {
    console.log('\n✅ Repository structure initialized!');
  } else {
    console.log('\n✓ Repository structure already complete.');
  }
  
  return results;
}

/**
 * Verify repository structure
 * @returns {Object} Verification results
 */
function verifyRepo() {
  console.log('\n🔍 Verifying Repository Structure\n');
  
  const missing = [];
  const present = [];
  
  REQUIRED_DIRS.forEach(dir => {
    if (dirExists(dir)) {
      present.push(dir);
    } else {
      missing.push(dir);
    }
  });
  
  console.log(`Present: ${present.length}/${REQUIRED_DIRS.length}`);
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing directories:');
    missing.forEach(dir => console.log(`  - ${dir}/`));
  }
  
  return {
    complete: missing.length === 0,
    present,
    missing
  };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'init';
  
  switch (command) {
    case 'init':
      initRepo();
      break;
    case 'verify':
      const result = verifyRepo();
      process.exit(result.complete ? 0 : 1);
      break;
    default:
      console.log('Usage: node repoInit.js [init|verify]');
  }
}

module.exports = { initRepo, verifyRepo, REQUIRED_DIRS };
