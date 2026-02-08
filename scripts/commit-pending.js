#!/usr/bin/env node
/**
 * @fileoverview Commit Pending - Automatiza commit de mudanças pendentes
 * @description Analisa arquivos modificados e gera mensagens de commit inteligentes
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/commit-pending.js [--dry-run] [--message="custom"]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Configuração
 * @constant {Object}
 */
const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  customMessage: process.argv.find(arg => arg.startsWith('--message='))?.split('=')[1],
  autoStage: true
};

/**
 * Obtém arquivos modificados do git
 * @returns {Object} Objeto com staged, modified e untracked
 */
function getGitStatus() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = output.split('\n').filter(Boolean);
    
    const staged = [];
    const modified = [];
    const untracked = [];
    
    lines.forEach(line => {
      const status = line.slice(0, 2);
      const file = line.slice(3).trim();
      
      if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      } else if (status === '??') {
        untracked.push(file);
      } else {
        modified.push(file);
      }
    });
    
    return { staged, modified, untracked };
  } catch {
    return { staged: [], modified: [], untracked: [] };
  }
}

/**
 * Categoriza arquivos por tipo
 * @param {string[]} files - Lista de arquivos
 * @returns {Object} Arquivos categorizados
 */
function categorizeFiles(files) {
  const categories = {
    docs: [],
    code: [],
    tests: [],
    config: [],
    scripts: [],
    other: []
  };
  
  files.forEach(file => {
    const ext = path.extname(file);
    const basename = path.basename(file);
    
    if (file.includes('README') || file.includes('CHANGELOG') || file.includes('.md')) {
      categories.docs.push(file);
    } else if (file.includes('test') || file.includes('spec') || ext === '.test.js') {
      categories.tests.push(file);
    } else if (basename === 'package.json' || basename === '.gitignore' || basename === 'tsconfig.json') {
      categories.config.push(file);
    } else if (file.startsWith('scripts/')) {
      categories.scripts.push(file);
    } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go'].includes(ext)) {
      categories.code.push(file);
    } else {
      categories.other.push(file);
    }
  });
  
  return categories;
}

/**
 * Gera mensagem de commit baseada nas mudanças
 * @param {Object} categories - Arquivos categorizados
 * @param {string[]} untracked - Arquivos novos
 * @returns {string} Mensagem de commit
 */
function generateCommitMessage(categories, untracked) {
  if (CONFIG.customMessage) {
    return CONFIG.customMessage;
  }
  
  const parts = [];
  const totalFiles = Object.values(categories).flat().length + untracked.length;
  
  // Detecta tipo principal de mudança
  if (categories.docs.length > 0) {
    parts.push('docs');
  }
  if (categories.code.length > 0 || categories.scripts.length > 0) {
    parts.push(categories.scripts.length > categories.code.length ? 'feat' : 'refactor');
  }
  if (categories.tests.length > 0) {
    parts.push('test');
  }
  if (categories.config.length > 0) {
    parts.push('config');
  }
  
  // Se houver apenas arquivos novos
  if (untracked.length > 0 && parts.length === 0) {
    return `feat: add ${untracked.length} new file(s)`;
  }
  
  // Monta mensagem
  const type = parts[0] || 'chore';
  let message = `${type}:`;
  
  if (categories.scripts.length > 0) {
    message += ` update ${categories.scripts.length} script(s)`;
  } else if (categories.docs.length > 0) {
    message += ` update documentation`;
  } else if (categories.code.length > 0) {
    message += ` improve ${categories.code.length} module(s)`;
  } else if (categories.config.length > 0) {
    message += ` adjust configuration`;
  } else if (categories.tests.length > 0) {
    message += ` add/update tests`;
  } else {
    message += ` update ${totalFiles} file(s)`;
  }
  
  return message;
}

/**
 * Gera descrição detalhada do commit
 * @param {Object} categories - Arquivos categorizados
 * @param {string[]} untracked - Arquivos novos
 * @returns {string} Corpo do commit
 */
function generateCommitBody(categories, untracked) {
  const lines = [];
  
  Object.entries(categories).forEach(([type, files]) => {
    if (files.length > 0) {
      lines.push(`\n${type.toUpperCase()}:`);
      files.forEach(f => lines.push(`  - ${f}`));
    }
  });
  
  if (untracked.length > 0) {
    lines.push('\nNEW FILES:');
    untracked.forEach(f => lines.push(`  - ${f}`));
  }
  
  return lines.join('\n');
}

/**
 * Executa git add
 * @param {string[]} files - Arquivos para adicionar
 * @returns {boolean} Sucesso
 */
function stageFiles(files) {
  if (files.length === 0) return true;
  
  try {
    execSync('git add .', { encoding: 'utf8' });
    return true;
  } catch (e) {
    console.error('❌ Erro ao fazer stage:', e.message);
    return false;
  }
}

/**
 * Executa git commit
 * @param {string} message - Mensagem do commit
 * @param {string} body - Corpo do commit
 * @returns {boolean} Sucesso
 */
function commit(message, body) {
  try {
    const fullMessage = body ? `${message}\n${body}` : message;
    execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    return true;
  } catch (e) {
    console.error('❌ Erro ao fazer commit:', e.message);
    return false;
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🦊 Kaixa Commit Pending\n');
  
  const status = getGitStatus();
  const allFiles = [...status.staged, ...status.modified, ...status.untracked];
  
  if (allFiles.length === 0) {
    console.log('✅ Nada para commitar. Working directory limpo.');
    process.exit(0);
  }
  
  console.log(`📁 ${allFiles.length} arquivo(s) para commitar:\n`);
  
  const categories = categorizeFiles([...status.staged, ...status.modified]);
  
  // Exibe resumo
  Object.entries(categories).forEach(([type, files]) => {
    if (files.length > 0) {
      console.log(`  ${type}: ${files.length} arquivo(s)`);
      files.slice(0, 3).forEach(f => console.log(`    - ${f}`));
      if (files.length > 3) console.log(`    ... e mais ${files.length - 3}`);
    }
  });
  
  if (status.untracked.length > 0) {
    console.log(`  novos: ${status.untracked.length} arquivo(s)`);
    status.untracked.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    if (status.untracked.length > 3) console.log(`    ... e mais ${status.untracked.length - 3}`);
  }
  
  // Gera mensagem
  const message = generateCommitMessage(categories, status.untracked);
  const body = generateCommitBody(categories, status.untracked);
  
  console.log(`\n💬 Mensagem: ${message}`);
  
  if (CONFIG.dryRun) {
    console.log('\n🏃 DRY-RUN: Nenhuma ação executada');
    console.log('\nCorpo do commit:');
    console.log(body);
    process.exit(0);
  }
  
  // Stage e commit
  console.log('\n📝 Fazendo stage...');
  if (!stageFiles(allFiles)) {
    process.exit(1);
  }
  
  console.log('💾 Fazendo commit...');
  if (!commit(message, body)) {
    process.exit(1);
  }
  
  console.log('\n✅ Commit realizado com sucesso!');
  console.log(`   ${message.split(':')[0]}: ${message.split(':')[1] || ''}`);
}

main();
