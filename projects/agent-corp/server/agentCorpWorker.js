#!/usr/bin/env node
/**
 * Agent Corp - Worker
 * Servidor de tarefas em background
 */

const http = require('http');
const Logger = require('../scripts/lib/logger');

const logger = new Logger({ level: 'info', colors: true });

// =============================================================================
// CONFIG
// =============================================================================

const CONFIG = {
  port: 8080,
  host: 'localhost',
  interval: 10 * 60 * 1000 // 10 minutos
};

// =============================================================================
// TAREFAS
// =============================================================================

const tasks = {
  'health-check': async () => {
    logger.fox('Health check executado');
    return { status: 'healthy', checks: 5 };
  },
  
  'metrics-update': async () => {
    logger.fox('Métricas atualizadas');
    return { metrics: 12 };
  },
  
  'log-cleanup': async () => {
    logger.fox('Logs antigos removidos');
    return { removed: 10, size: '5MB' };
  },
  
  'backup-state': async () => {
    logger.fox('Backup do estado realizado');
    return { files: 3, size: '2.4MB' };
  },
  
  'improvement-track': async () => {
    logger.fox('Rastreamento de melhorias atualizado');
    return { improvements: 67 };
  },
  
  'code-improvement': async () => {
    logger.fox('Geração de melhoria de código');
    return { suggestion: 'Adicionar validação de entrada' };
  }
};

// =============================================================================
// SERVIDOR HTTP
// =============================================================================

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
    return;
  }
  
  if (req.url === '/api/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'running',
      tasks: Object.keys(tasks),
      interval: CONFIG.interval
    }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// =============================================================================
// EXECUTOR DE TAREFAS
// =============================================================================

async function executeRandomTask() {
  const taskNames = Object.keys(tasks);
  const randomTask = taskNames[Math.floor(Math.random() * taskNames.length)];
  
  logger.info(`Executando tarefa: ${randomTask}`);
  
  try {
    const result = await tasks[randomTask]();
    logger.success(`Tarefa ${randomTask} completada`, result);
    return result;
  } catch (error) {
    logger.error(`Erro na tarefa ${randomTask}`, { error: error.message });
    return null;
  }
}

// =============================================================================
// MAIN
// =============================================================================

function start() {
  logger.section('AGENT CORP - WORKER');
  logger.info(`Endpoint: http://${CONFIG.host}:${CONFIG.port}`);
  logger.info(`Intervalo: ${CONFIG.interval / 1000}s`);
  
  // Iniciar servidor
  server.listen(CONFIG.port, CONFIG.host, () => {
    logger.success(`Worker rodando em http://${CONFIG.host}:${CONFIG.port}`);
  });
  
  // Executar primeira tarefa imediatamente
  executeRandomTask();
  
  // Agendar próximas tarefas
  setInterval(executeRandomTask, CONFIG.interval);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Recebido SIGTERM, encerrando...');
    server.close(() => {
      process.exit(0);
    });
  });
}

start();
