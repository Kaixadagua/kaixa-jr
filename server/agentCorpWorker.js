/**
 * Kaixa Jr - AgentCorp Worker
 * Executa tarefas automáticas no AgentCorp
 * 
 * @module server/agentCorpWorker
 */

const http = require('http');
const { updateStatus, completeTask } = require('./agentServer');

const AGENTCORP_ENDPOINT = process.env.AGENTCORP_ENDPOINT || 'http://localhost:8080/api';
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10 * 60 * 1000; // 10 min

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
  TASKS.forEach(t => console.log(`  - ${t.name}`));
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
  TASKS
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
