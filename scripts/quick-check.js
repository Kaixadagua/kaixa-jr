#!/usr/bin/env node
/**
 * quick-check.js - Verificação ultrarrápida para decisões automatizadas
 * 
 * Uso: node scripts/quick-check.js
 * Saída: JSON com status do sistema
 * Tempo alvo: <100ms
 * 
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = 'C:\\Users\\joaov\\.openclaw\\workspace';
const REPO = 'aura-io-saas/aurahub';
const IMPROVEMENTS_DIR = path.join(WORKSPACE, 'memory', 'improvements');

/**
 * Executa comando e retorna output ou null em erro
 */
function run(cmd, timeout = 5000) {
  try {
    return execSync(cmd, { 
      encoding: 'utf8', 
      cwd: WORKSPACE,
      timeout 
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Conta arquivos em diretório
 */
function countFiles(dir, ext) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith(ext)).length;
  } catch {
    return 0;
  }
}

// Timestamp
const startTime = Date.now();

// Git status
const branch = run('git branch --show-current', 1000) || 'unknown';
const hasChanges = !!run('git status --short', 1000);

// Backpressure (gh pr list)
const prOutput = run(`gh pr list --repo ${REPO} --state open`, 8000);
const prCount = prOutput ? prOutput.split('\n').filter(l => l.trim()).length : -1;

// Status de backpressure
let backpressureStatus = 'unknown';
if (prCount >= 0) {
  if (prCount >= 9) backpressureStatus = 'red';
  else if (prCount >= 6) backpressureStatus = 'yellow';
  else backpressureStatus = 'green';
}

// Melhorias
const improvementsCount = fs.existsSync(IMPROVEMENTS_DIR) 
  ? fs.readdirSync(IMPROVEMENTS_DIR).filter(f => f.endsWith('.md') && !f.includes('CONSOLIDADO')).length 
  : 0;

// Scripts
const scriptsCount = countFiles(path.join(WORKSPACE, 'scripts'), '.js') + 
                     countFiles(path.join(WORKSPACE, 'scripts'), '.ps1');

// Tempo de execução
const duration = Date.now() - startTime;

// Resultado
const result = {
  timestamp: new Date().toISOString(),
  git: {
    branch,
    clean: !hasChanges
  },
  backpressure: {
    count: prCount,
    status: backpressureStatus,
    shouldCreatePR: backpressureStatus === 'green' || backpressureStatus === 'yellow'
  },
  metrics: {
    improvements: improvementsCount,
    scripts: scriptsCount
  },
  performance: {
    durationMs: duration
  }
};

// Saída JSON
console.log(JSON.stringify(result, null, 2));

// Exit code para scripts
process.exit(backpressureStatus === 'red' ? 1 : 0);
