#!/usr/bin/env node
/**
 * Kaixa Jr CLI
 * Command line interface for Kaixa Jr operations
 * 
 * @module bin/kaixa
 */

const { getConfig } = require('../src/core/config');
const { getLogger } = require('../src/core/logger');
const fs = require('fs');
const path = require('path');

const logger = getLogger();
const config = getConfig();

const COMMANDS = {
  'help': {
    description: 'Show help information',
    usage: 'kaixa help [command]'
  },
  'status': {
    description: 'Show system status',
    usage: 'kaixa status'
  },
  'health': {
    description: 'Run health check',
    usage: 'kaixa health'
  },
  'report': {
    description: 'Generate status report',
    usage: 'kaixa report'
  },
  'improvements': {
    description: 'Show improvement statistics',
    usage: 'kaixa improvements'
  },
  'config': {
    description: 'Show configuration',
    usage: 'kaixa config [key]'
  },
  'validate': {
    description: 'Validate configuration',
    usage: 'kaixa validate'
  },
  'generate': {
    description: 'Generate code (system, test, skill, docs)',
    usage: 'kaixa generate <type> [args...]'
  },
  'docs': {
    description: 'Generate documentation from JSDoc',
    usage: 'kaixa docs'
  },
  'skill': {
    description: 'Run a skill (health, git, progress)',
    usage: 'kaixa skill <name>'
  },
  'version': {
    description: 'Show version',
    usage: 'kaixa version'
  }
};

/**
 * Show help
 */
function showHelp(command = null) {
  if (command && COMMANDS[command]) {
    console.log(`\n${config.get('agentEmoji')} ${command}\n`);
    console.log(`  Description: ${COMMANDS[command].description}`);
    console.log(`  Usage: ${COMMANDS[command].usage}\n`);
    return;
  }
  
  console.log(`\n${config.get('agentEmoji')} Kaixa Jr CLI v${config.get('version') || '1.0.0'}\n`);
  console.log('Usage: kaixa <command> [options]\n');
  console.log('Commands:');
  
  Object.entries(COMMANDS).forEach(([cmd, info]) => {
    console.log(`  ${cmd.padEnd(15)} ${info.description}`);
  });
  
  console.log('\nExamples:');
  console.log('  kaixa status');
  console.log('  kaixa health');
  console.log('  kaixa config agentName');
  console.log('');
}

/**
 * Show status
 */
function showStatus() {
  console.log(`\n${config.get('agentEmoji')} Kaixa Jr Status\n`);
  console.log('═'.repeat(50));
  
  // Agent info
  console.log(`\n📋 Agent:`);
  console.log(`  Name: ${config.get('agentName')}`);
  console.log(`  Emoji: ${config.get('agentEmoji')}`);
  console.log(`  Environment: ${config.get('nodeEnv')}`);
  
  // Improvements count
  const improvementsDir = path.join(process.cwd(), 'memory', 'improvements');
  let improvementsCount = 0;
  try {
    improvementsCount = fs.readdirSync(improvementsDir).filter(f => f.endsWith('.md')).length;
  } catch {}
  
  console.log(`\n📈 Improvements:`);
  console.log(`  Total: ${improvementsCount}`);
  
  // Configuration status
  const validation = config.validate();
  console.log(`\n⚙️  Configuration:`);
  console.log(`  Valid: ${validation.valid ? '✅' : '❌'}`);
  if (!validation.valid) {
    console.log(`  Missing: ${validation.missing.join(', ')}`);
  }
  
  // Repository info
  console.log(`\n📁 Repositories:`);
  console.log(`  Workspace: ${config.get('repoWorkspace')}`);
  console.log(`  AgentCorp: ${config.get('repoAgentCorp')}`);
  console.log(`  Aurahub: ${config.get('repoAurahub')}`);
  
  console.log('\n' + '═'.repeat(50) + '\n');
}

/**
 * Run health check
 */
function runHealth() {
  logger.info('Running health check...');
  
  const healthScript = path.join(process.cwd(), 'scripts', 'health', 'kaixa-guardian.js');
  
  if (!fs.existsSync(healthScript)) {
    logger.error('Health script not found');
    process.exit(1);
  }
  
  require(healthScript);
}

/**
 * Generate report
 */
function generateReport() {
  logger.info('Generating report...');
  
  const reportScript = path.join(process.cwd(), 'scripts', 'reports', 'kaixa-report-35min.js');
  
  if (!fs.existsSync(reportScript)) {
    logger.error('Report script not found');
    process.exit(1);
  }
  
  require(reportScript);
}

/**
 * Show improvements
 */
function showImprovements() {
  const improvementsDir = path.join(process.cwd(), 'memory', 'improvements');
  
  let files = [];
  try {
    files = fs.readdirSync(improvementsDir).filter(f => f.endsWith('.md'));
  } catch {
    console.log('No improvements found.');
    return;
  }
  
  console.log(`\n${config.get('agentEmoji')} Improvements (${files.length})\n`);
  console.log('═'.repeat(50));
  
  // Group by date
  const byDate = {};
  files.forEach(file => {
    const date = file.substring(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(file);
  });
  
  Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([date, items]) => {
      console.log(`\n📅 ${date}: ${items.length} improvements`);
    });
  
  console.log('\n' + '═'.repeat(50) + '\n');
}

/**
 * Show configuration
 */
function showConfig(key = null) {
  if (key) {
    const value = config.get(key);
    console.log(`\n${key}: ${JSON.stringify(value, null, 2)}\n`);
  } else {
    console.log(`\n${config.get('agentEmoji')} Configuration\n`);
    console.log('═'.repeat(50));
    
    const all = config.getAll();
    Object.entries(all).forEach(([k, v]) => {
      // Mask sensitive values
      if (['gatewayToken', 'githubToken', 'telegramBotToken'].includes(k)) {
        console.log(`  ${k}: ***`);
      } else {
        console.log(`  ${k}: ${JSON.stringify(v)}`);
      }
    });
    
    console.log('═'.repeat(50) + '\n');
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  const validation = config.validate();
  
  console.log(`\n${config.get('agentEmoji')} Configuration Validation\n`);
  console.log('═'.repeat(50));
  
  if (validation.valid) {
    console.log('\n✅ All required configuration is present.\n');
  } else {
    console.log('\n❌ Missing configuration:\n');
    validation.missing.forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log('');
  }
  
  console.log('═'.repeat(50) + '\n');
  
  process.exit(validation.valid ? 0 : 1);
}

/**
 * Show version
 */
function showVersion() {
  const pkg = require('../package.json');
  console.log(`${config.get('agentEmoji')} ${pkg.name} v${pkg.version}`);
}

/**
 * Generate code from templates
 */
function generateCode(type, ...args) {
  const { CodeGenerator } = require('../src/utils/codeGenerator');
  const generator = new CodeGenerator();
  
  switch (type) {
    case 'system':
      if (args[0] && args[1]) {
        generator.generateSystem(args[0], args[1]);
      } else {
        console.log('Usage: kaixa generate system <name> <description>');
      }
      break;
      
    case 'test':
      if (args[0] && args[1]) {
        generator.generateTest(args[0], args[1]);
      } else {
        console.log('Usage: kaixa generate test <name> <module-path>');
      }
      break;
      
    case 'skill':
      if (args[0] && args[1]) {
        generator.generateSkill(args[0], args[1]);
      } else {
        console.log('Usage: kaixa generate skill <name> <description>');
      }
      break;
      
    default:
      console.log('Generate types: system, test, skill');
      console.log('Usage: kaixa generate <type> [args...]');
  }
}

/**
 * Generate documentation from JSDoc
 */
function generateDocs() {
  const { DocGenerator } = require('../src/utils/docGenerator');
  const generator = new DocGenerator();
  generator.generateAll();
}

/**
 * Run a skill
 */
function runSkill(name) {
  const skillsDir = path.join(process.cwd(), 'skills');
  
  const skillMap = {
    'health': 'agent-health-monitor',
    'agent-health': 'agent-health-monitor',
    'git': 'git-readonly',
    'progress': 'progressao-continua',
    'progressao': 'progressao-continua'
  };
  
  const skillDir = skillMap[name] || name;
  const skillPath = path.join(skillsDir, skillDir, 'index.js');
  
  if (!fs.existsSync(skillPath)) {
    console.log(`\n❌ Skill not found: ${name}`);
    console.log('\nAvailable skills:');
    console.log('  health, git, progress');
    return;
  }
  
  try {
    const skill = require(skillPath);
    if (skill.run) {
      skill.run();
    } else {
      console.log(`\n❌ Skill ${name} has no run() function`);
    }
  } catch (e) {
    console.error(`\n❌ Error running skill ${name}:`, e.message);
  }
}

/**
 * Main CLI handler
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'help':
    case '-h':
    case '--help':
      showHelp(args[1]);
      break;
      
    case 'status':
    case 's':
      showStatus();
      break;
      
    case 'health':
    case 'h':
      runHealth();
      break;
      
    case 'report':
    case 'r':
      generateReport();
      break;
      
    case 'improvements':
    case 'i':
      showImprovements();
      break;
      
    case 'config':
    case 'c':
      showConfig(args[1]);
      break;
      
    case 'validate':
    case 'v':
      validateConfig();
      break;
      
    case 'generate':
    case 'g':
      generateCode(args[1], ...args.slice(2));
      break;
      
    case 'docs':
    case 'd':
      generateDocs();
      break;
      
    case 'skill':
    case 'k':
      runSkill(args[1]);
      break;
      
    case 'version':
    case '-v':
    case '--version':
      showVersion();
      break;
      
    default:
      console.log(`\n❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, COMMANDS };
