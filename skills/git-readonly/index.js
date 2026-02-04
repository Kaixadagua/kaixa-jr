/**
 * Git Readonly Skill
 * Operações seguras de leitura no Git
 * 
 * @module skills/git-readonly
 */

const { execSync } = require('child_process');

/**
 * Execute git command safely (readonly)
 * @param {string} command - Git command
 * @returns {string} Output
 */
function gitReadonly(command) {
  // Only allow safe readonly commands
  const allowedCommands = ['status', 'log', 'branch', 'remote', 'diff', 'show'];
  const cmd = command.split(' ')[0];
  
  if (!allowedCommands.includes(cmd)) {
    throw new Error(`Command '${cmd}' not allowed in readonly mode`);
  }
  
  try {
    return execSync(`git ${command}`, { encoding: 'utf8', cwd: process.cwd() });
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

/**
 * Get repository status
 * @returns {Object} Repository status
 */
function getStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() });
    const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: process.cwd() }).trim();
    
    return {
      branch,
      clean: status.trim() === '',
      changes: status.trim().split('\n').filter(Boolean).length
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get recent commits
 * @param {number} count - Number of commits
 * @returns {Array} Recent commits
 */
function getRecentCommits(count = 5) {
  try {
    const log = execSync(
      `git log --oneline -${count}`,
      { encoding: 'utf8', cwd: process.cwd() }
    );
    
    return log.trim().split('\n').map(line => {
      const [hash, ...msgParts] = line.split(' ');
      return { hash, message: msgParts.join(' ') };
    });
  } catch (e) {
    return [];
  }
}

/**
 * Get branch information
 * @returns {Object} Branch info
 */
function getBranchInfo() {
  try {
    const current = execSync('git branch --show-current', { 
      encoding: 'utf8', 
      cwd: process.cwd() 
    }).trim();
    
    const all = execSync('git branch -a', { 
      encoding: 'utf8', 
      cwd: process.cwd() 
    }).trim().split('\n').map(b => b.trim());
    
    return {
      current,
      all,
      local: all.filter(b => !b.startsWith('remotes/')),
      remote: all.filter(b => b.startsWith('remotes/'))
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Check if working directory is clean
 * @returns {boolean}
 */
function isClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() });
    return status.trim() === '';
  } catch (e) {
    return false;
  }
}

/**
 * Get file changes
 * @returns {Array} Changed files
 */
function getChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() });
    
    return status.trim().split('\n').filter(Boolean).map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3).trim()
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Run skill
 */
function run() {
  console.log('\n📊 Git Readonly Status\n');
  console.log('═'.repeat(50));
  
  const status = getStatus();
  console.log(`\nBranch: ${status.branch}`);
  console.log(`Status: ${status.clean ? '✅ Clean' : '⚠️ Has changes'}`);
  console.log(`Changes: ${status.changes} file(s)`);
  
  const commits = getRecentCommits(3);
  console.log('\nRecent commits:');
  commits.forEach(c => {
    console.log(`  ${c.hash.substring(0, 7)} ${c.message}`);
  });
  
  if (!status.clean) {
    const changes = getChanges();
    console.log('\nChanged files:');
    changes.forEach(c => {
      console.log(`  ${c.status.padEnd(2)} ${c.file}`);
    });
  }
  
  console.log('═'.repeat(50) + '\n');
  
  return {
    status,
    commits,
    changes: status.clean ? [] : getChanges()
  };
}

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = {
  run,
  gitReadonly,
  getStatus,
  getRecentCommits,
  getBranchInfo,
  isClean,
  getChanges
};
