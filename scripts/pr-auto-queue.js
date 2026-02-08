/**
 * @fileoverview PR Auto-Queue - Sistema de fila automática para PRs
 * 
 * Detecta quando backpressure liberar e automaticamente converte
 * melhorias locais em PRs, mantendo o fluxo contínuo.
 * 
 * @author Kaixa Jr
 * @since 2026-02-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const CONFIG = {
  REPO: 'Kaixadagua/kaixa-jr',
  IMPROVEMENTS_DIR: path.join(__dirname, '..', 'memory', 'improvements'),
  BACKPRESSURE_THRESHOLD: 9,
  CHECK_INTERVAL_MS: 5 * 60 * 1000, // 5 minutos
};

/**
 * @typedef {Object} BackpressureStatus
 * @property {boolean} active - Se backpressure está ativo
 * @property {number} openPRs - Número de PRs abertos
 * @property {number} threshold - Limite para backpressure
 */

/**
 * Verifica status atual de backpressure
 * @returns {BackpressureStatus}
 */
function checkBackpressure() {
  try {
    const output = execSync(`gh pr list --repo ${CONFIG.REPO} --state open --json number`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const prs = JSON.parse(output || '[]');
    const openCount = Array.isArray(prs) ? prs.length : 0;
    
    return {
      active: openCount >= CONFIG.BACKPRESSURE_THRESHOLD,
      openPRs: openCount,
      threshold: CONFIG.BACKPRESSURE_THRESHOLD
    };
  } catch (error) {
    console.error('❌ Erro ao verificar backpressure:', error.message);
    return { active: true, openPRs: 99, threshold: CONFIG.BACKPRESSURE_THRESHOLD };
  }
}

/**
 * @typedef {Object} LocalImprovement
 * @property {string} filename - Nome do arquivo
 * @property {string} date - Data da melhoria
 * @property {string} type - Tipo (local, pr, docs, code, etc.)
 */

/**
 * Lista melhorias locais disponíveis
 * @returns {LocalImprovement[]}
 */
function listLocalImprovements() {
  const improvements = [];
  
  try {
    const files = fs.readdirSync(CONFIG.IMPROVEMENTS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'TRACKING.md') continue;
      
      const filepath = path.join(CONFIG.IMPROVEMENTS_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // Detecta tipo baseado no conteúdo
      let type = 'local';
      if (content.includes('🚀 PR') || content.includes('Pull Request')) {
        type = 'pr';
      } else if (content.includes('📍 Local') || content.includes('Local')) {
        type = 'local';
      }
      
      // Extrai data do filename
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : 'unknown';
      
      improvements.push({ filename: file, date, type });
    }
  } catch (error) {
    console.error('❌ Erro ao listar melhorias:', error.message);
  }
  
  return improvements.filter(i => i.type === 'local');
}

/**
 * @typedef {Object} QueueStatus
 * @property {number} totalLocal - Total de melhorias locais
 * @property {boolean} readyToConvert - Se está pronto para converter
 * @property {string[]} candidates - Arquivos candidatos a PR
 */

/**
 * Verifica status da fila de PRs
 * @returns {QueueStatus}
 */
function checkQueueStatus() {
  const backpressure = checkBackpressure();
  const localImprovements = listLocalImprovements();
  
  // Candidatos: melhorias locais mais recentes (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const candidates = localImprovements
    .filter(imp => new Date(imp.date) >= sevenDaysAgo)
    .map(imp => imp.filename);
  
  return {
    totalLocal: localImprovements.length,
    readyToConvert: !backpressure.active && candidates.length > 0,
    candidates
  };
}

/**
 * Cria um batch PR a partir de melhorias locais
 * @param {string[]} candidates - Lista de arquivos candidatos
 * @returns {boolean}
 */
function createBatchPR(candidates) {
  const timestamp = new Date().toISOString().split('T')[0];
  const branchName = `batch/auto-pr-${timestamp}`;
  
  try {
    // Cria branch
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    
    // Adiciona arquivos modificados (simulação - em produção seria real)
    console.log(`📦 Criando batch PR com ${candidates.length} melhorias...`);
    
    // Commit
    execSync('git add -A', { stdio: 'ignore' });
    execSync(`git commit -m "batch: auto-convert ${candidates.length} local improvements"`, {
      stdio: 'ignore'
    });
    
    // Push
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    
    // Cria PR
    execSync(
      `gh pr create --repo ${CONFIG.REPO} --title "batch: auto-convert local improvements" ` +
      `--body "Auto-generated PR from PR Auto-Queue system.\n\nContains ${candidates.length} local improvements ready for review."`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ Batch PR criado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar batch PR:', error.message);
    return false;
  }
}

/**
 * Executa ciclo de verificação e conversão
 */
function run() {
  console.log('🔄 PR Auto-Queue - Verificando...');
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
  console.log('');
  
  const backpressure = checkBackpressure();
  const queue = checkQueueStatus();
  
  // Status visual
  const bpEmoji = backpressure.active ? '🔴' : '🟢';
  console.log(`${bpEmoji} Backpressure: ${backpressure.active ? 'ATIVO' : 'LIVRE'}`);
  console.log(`   PRs abertos: ${backpressure.openPRs}/${backpressure.threshold}`);
  console.log(`   Melhorias locais: ${queue.totalLocal}`);
  console.log(`   Candidatos (7 dias): ${queue.candidates.length}`);
  console.log('');
  
  // Decisão
  if (queue.readyToConvert) {
    console.log('🚀 Backpressure liberado! Criando batch PR...');
    const success = createBatchPR(queue.candidates);
    
    if (success) {
      console.log('✅ Melhorias locais convertidas para PR!');
    }
  } else if (backpressure.active) {
    console.log('⏳ Backpressure ativo. Aguardando liberação...');
    console.log('💡 Use --force para ignorar backpressure (cuidado!)');
  } else {
    console.log('ℹ️ Nenhuma melhoria local recente para converter.');
  }
  
  console.log('');
  console.log('🦊 PR Auto-Queue - Ciclo completo');
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--status')) {
  // Modo JSON para integração
  const backpressure = checkBackpressure();
  const queue = checkQueueStatus();
  console.log(JSON.stringify({ backpressure, queue }, null, 2));
} else if (args.includes('--force')) {
  // Força criação de PR ignorando backpressure
  console.log('⚠️ Modo FORCE ativado - ignorando backpressure!');
  const queue = checkQueueStatus();
  if (queue.candidates.length > 0) {
    createBatchPR(queue.candidates);
  } else {
    console.log('ℹ️ Nenhuma melhoria candidata encontrada.');
  }
} else {
  // Modo padrão
  run();
}

module.exports = { checkBackpressure, listLocalImprovements, checkQueueStatus, createBatchPR };
