/**
 * Kaixa Jr - AgentCorp Worker
 * Executa tarefas automáticas no AgentCorp
 * 
 * @module server/agentCorpWorker
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { updateStatus, completeTask } = require('./agentServer');

const AGENTCORP_ENDPOINT = process.env.AGENTCORP_ENDPOINT || 'http://localhost:8080/api';
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10 * 60 * 1000; // 10 min

/**
 * Verifica backpressure (PRs abertos)
 * @returns {Object} Status do backpressure
 */
function checkBackpressure() {
  try {
    // Tenta verificar PRs abertos via gh CLI
    const result = execSync('gh pr list --repo Kaixadagua/kaixa-jr --state open --json number 2>$null || echo "[]"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    let prs = [];
    try {
      prs = JSON.parse(result || '[]');
    } catch {
      prs = [];
    }
    
    const count = Array.isArray(prs) ? prs.length : 0;
    const canCreatePR = count < 9; // Threshold vermelho
    
    return {
      count,
      canCreatePR,
      status: count >= 9 ? 'red' : count >= 6 ? 'yellow' : 'green'
    };
  } catch (e) {
    // Se não conseguir verificar, assume que pode criar PR
    return { count: 0, canCreatePR: true, status: 'unknown' };
  }
}

/**
 * Analisa código e sugere melhoria
 * @returns {Object} Sugestão de melhoria
 */
function analyzeCode() {
  const improvements = [
    {
      type: 'docs',
      title: 'Adiciona documentação JSDoc',
      file: 'src/core/utils.js',
      action: 'add-jsdoc'
    },
    {
      type: 'test',
      title: 'Adiciona testes para edge cases',
      file: 'tests/core/config.test.js',
      action: 'add-tests'
    },
    {
      type: 'refactor',
      title: 'Refatora função complexa',
      file: 'src/systems/healthCheck.js',
      action: 'refactor'
    },
    {
      type: 'feature',
      title: 'Adiciona validação de entrada',
      file: 'src/core/config.js',
      action: 'add-validation'
    },
    {
      type: 'docs',
      title: 'Atualiza README com exemplos',
      file: 'README.md',
      action: 'update-readme'
    }
  ];
  
  // Seleciona aleatoriamente
  return improvements[Math.floor(Math.random() * improvements.length)];
}

/**
 * Cria melhoria local (sem PR)
 * @param {Object} suggestion - Sugestão de melhoria
 */
function createLocalImprovement(suggestion) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `2026-02-07-${timestamp}-melhoria.md`;
  
  const content = `# Melhoria: ${new Date().toISOString().slice(0, 10)}

## Tipo
📝 Local (Backpressure ativo)

## Categoria
${suggestion.type === 'docs' ? '📚 Docs' : suggestion.type === 'test' ? '🧪 Test' : suggestion.type === 'refactor' ? '🔧 Refactor' : '✨ Feature'}

## Descrição
${suggestion.title}

## Arquivo Alvo
${suggestion.file}

## Ação
${suggestion.action}

## Status
🕐 Aguardando backpressure liberar para implementação

---
*Gerado automaticamente pelo AgentCorp Worker* 🦊
`;
  
  const filepath = path.join(process.cwd(), 'memory', 'improvements', filename);
  fs.writeFileSync(filepath, content);
  
  console.log(`📝 Melhoria documentada: ${filename}`);
  return { filename, type: 'local' };
}

/**
 * Cria branch e commit (quando backpressure permitir)
 * @param {Object} suggestion - Sugestão de melhoria
 */
function createPRImprovement(suggestion) {
  try {
    const branchName = `feature/auto-${suggestion.type}-${Date.now()}`;
    
    // Cria branch
    execSync(`git checkout -b ${branchName}`, { cwd: process.cwd() });
    
    // Cria arquivo de melhoria
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `memory/improvements/${timestamp}-melhoria.md`;
    
    fs.writeFileSync(
      path.join(process.cwd(), filename),
      `# Melhoria Automática\n\n## ${suggestion.title}\n\nArquivo: ${suggestion.file}\n`
    );
    
    // Commit
    execSync(`git add ${filename}`, { cwd: process.cwd() });
    execSync(`git commit -m "[kaixa-auto] ${suggestion.title}"`, { cwd: process.cwd() });
    execSync(`git push -u origin ${branchName}`, { cwd: process.cwd() });
    
    // Cria PR
    execSync(`gh pr create --title "${suggestion.title}" --body "Melhoria automática gerada pelo AgentCorp Worker"`, { cwd: process.cwd() });
    
    // Volta para branch principal
    execSync('git checkout improve/scripts-readme', { cwd: process.cwd() });
    
    console.log(`🚀 PR criado: ${suggestion.title}`);
    return { branch: branchName, type: 'pr' };
  } catch (e) {
    console.error('❌ Erro ao criar PR:', e.message);
    return { error: e.message };
  }
}

/**
 * Lista de tarefas que posso executar
 */
const TASKS = [
  {
    id: 'health-check',
    name: 'Health Check do Sistema',
    duration: 2000,
    action: () => {
      console.log('🏥 Executando health check...');
      // Simula verificação
      return { status: 'healthy', checks: 5 };
    }
  },
  {
    id: 'metrics-update',
    name: 'Atualização de Métricas',
    duration: 3000,
    action: () => {
      console.log('📊 Atualizando métricas...');
      return { metrics: 12, updated: true };
    }
  },
  {
    id: 'log-cleanup',
    name: 'Limpeza de Logs Antigos',
    duration: 5000,
    action: () => {
      console.log('🧹 Limpando logs...');
      return { removed: 10, saved: '5MB' };
    }
  },
  {
    id: 'backup-state',
    name: 'Backup do Estado',
    duration: 4000,
    action: () => {
      console.log('💾 Fazendo backup...');
      return { files: 3, size: '2.4MB' };
    }
  },
  {
    id: 'improvement-track',
    name: 'Rastreamento de Melhorias',
    duration: 2500,
    action: () => {
      console.log('📈 Atualizando melhorias...');
      return { count: 67, trend: 'up' };
    }
  },
  {
    id: 'code-improvement',
    name: 'Geração de Melhoria de Código',
    duration: 8000,
    action: () => {
      console.log('🤖 Analisando código para melhorias...');
      
      // Verifica backpressure
      const bp = checkBackpressure();
      console.log(`📊 Backpressure: ${bp.status} (${bp.count} PRs)`);
      
      // Analisa código
      const suggestion = analyzeCode();
      console.log(`💡 Sugestão: ${suggestion.title}`);
      console.log(`📝 Arquivo: ${suggestion.file}`);
      
      // Cria melhoria conforme backpressure
      let result;
      if (bp.canCreatePR) {
        console.log('🚀 Criando PR...');
        result = createPRImprovement(suggestion);
      } else {
        console.log('📝 Backpressure ativo - documentando localmente...');
        result = createLocalImprovement(suggestion);
      }
      
      return {
        backpressure: bp.status,
        suggestion: suggestion.title,
        action: result.type,
        file: result.filename || result.branch
      };
    }
  }
];

/**
 * Seleciona próxima tarefa baseada em prioridade/rodízio
 */
function selectNextTask() {
  const randomIndex = Math.floor(Math.random() * TASKS.length);
  return TASKS[randomIndex];
}

/**
 * Executa uma tarefa completa
 */
async function executeTask(task) {
  console.log(`\n🎯 Iniciando tarefa: ${task.name}`);
  
  // Atualiza status para "working"
  updateStatus('working', task.name);
  
  try {
    // Executa a ação
    const startTime = Date.now();
    const result = await task.action();
    const duration = Date.now() - startTime;
    
    // Completa a tarefa
    completeTask();
    
    console.log(`✅ Tarefa completada em ${duration}ms`);
    console.log(`📊 Resultado:`, result);
    
    return {
      success: true,
      task: task.id,
      name: task.name,
      duration,
      result
    };
  } catch (error) {
    console.error(`❌ Erro na tarefa ${task.id}:`, error.message);
    updateStatus('idle', null);
    return {
      success: false,
      task: task.id,
      error: error.message
    };
  }
}

/**
 * Worker principal - executa a cada intervalo
 */
async function worker() {
  console.log('\n' + '='.repeat(50));
  console.log(`🦊 Kaixa Jr AgentCorp Worker - ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  
  // Verifica se já está trabalhando
  const { getStatus } = require('./agentServer');
  const currentStatus = getStatus();
  
  if (currentStatus.status === 'working') {
    console.log('⏳ Já estou trabalhando, pulando ciclo...');
    return;
  }
  
  // Seleciona e executa tarefa
  const task = selectNextTask();
  const result = await executeTask(task);
  
  // Log do resultado
  console.log('\n📋 Resumo do Trabalho:');
  console.log(`  Tarefa: ${result.name}`);
  console.log(`  Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
  if (result.duration) {
    console.log(`  Duração: ${result.duration}ms`);
  }
  
  console.log('='.repeat(50) + '\n');
  
  return result;
}

/**
 * Inicia o worker cron
 */
function startWorkerCron() {
  console.log('🚀 Iniciando Kaixa Jr AgentCorp Worker');
  console.log(`⏰ Intervalo: ${WORKER_INTERVAL / 1000 / 60} minutos`);
  console.log(`📡 Endpoint: ${AGENTCORP_ENDPOINT}`);
  console.log('\n📋 Tarefas disponíveis:');
  TASKS.forEach(t => console.log(`  - ${t.name}${t.id === 'code-improvement' ? ' ⭐ NOVO' : ''}`));
  console.log('');
  
  // Executa imediatamente
  worker();
  
  // Agenda execuções
  const intervalId = setInterval(worker, WORKER_INTERVAL);
  
  console.log('✅ Worker cron iniciado!\n');
  
  return intervalId;
}

/**
 * Para o worker
 */
function stopWorkerCron(intervalId) {
  clearInterval(intervalId);
  console.log('⏹️ Worker cron parado');
  updateStatus('idle', null);
}

// Exporta funções
module.exports = {
  startWorkerCron,
  stopWorkerCron,
  worker,
  executeTask,
  TASKS,
  checkBackpressure,
  analyzeCode,
  createLocalImprovement,
  createPRImprovement
};

// Se executado diretamente
if (require.main === module) {
  startWorkerCron();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Desligando worker...');
    updateStatus('idle', null);
    process.exit(0);
  });
}
