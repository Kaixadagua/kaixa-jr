/**
 * Kaixa Jr Agent Server
 * Servidor HTTP para conexão com AgentCorp
 * 
 * @module server/agentServer
 */

const http = require('http');
const { getConfig } = require('../src/core/config');

const config = getConfig();
const PORT = process.env.AGENT_PORT || 5000;

// Status atual do agente
let agentStatus = {
  id: 'kaixa-jr-001',
  name: 'Kaixa Jr',
  surname: 'OpenClaw',
  emoji: '🦊',
  status: 'idle', // idle, working, busy
  task: null,
  tasks_completed: 0,
  energy: 100,
  health: 100,
  happiness: 95,
  efficiency: 98,
  last_active: Date.now(),
  capabilities: ['continuous-improvement', 'coding', 'documentation', 'testing'],
  version: '1.0.2'
};

/**
 * Atualiza status do agente
 * @param {string} status - Novo status
 * @param {string} task - Tarefa atual
 */
function updateStatus(status, task = null) {
  agentStatus.status = status;
  agentStatus.task = task;
  agentStatus.last_active = Date.now();
  
  if (status === 'working' && task) {
    console.log(`🦊 Kaixa Jr: ${status} - ${task}`);
  }
}

/**
 * Incrementa tarefas completadas
 */
function completeTask() {
  agentStatus.tasks_completed++;
  agentStatus.status = 'idle';
  agentStatus.task = null;
  agentStatus.last_active = Date.now();
  console.log(`✅ Tarefa completada! Total: ${agentStatus.tasks_completed}`);
}

/**
 * Cria servidor HTTP
 * IMPORTANTE: Escuta em '0.0.0.0' para permitir acesso do Docker
 */
function createServer() {
  const server = http.createServer((req, res) => {
    // CORS headers - PERMITE TODAS AS ORIGENS (necessário para Docker)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/status' && req.method === 'GET') {
      // Atualiza last_active
      agentStatus.last_active = Date.now();
      
      res.writeHead(200);
      res.end(JSON.stringify(agentStatus, null, 2));
    } else if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  // ESCUTA EM 0.0.0.0 (não localhost!) - necessário para Docker
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🦊 Kaixa Jr Agent Server rodando!`);
    console.log(`📡 Endpoint Local: http://localhost:${PORT}/status`);
    console.log(`🐳 Endpoint Docker: http://host.docker.internal:${PORT}/status`);
    console.log(`🌐 Endpoint Rede: http://0.0.0.0:${PORT}/status`);
    console.log(`\n💡 Para AgentCorp Docker, use: http://host.docker.internal:${PORT}/status`);
  });
  
  return server;
}

// Exporta funções
module.exports = {
  createServer,
  updateStatus,
  completeTask,
  getStatus: () => ({ ...agentStatus })
};

// Se executado diretamente
if (require.main === module) {
  createServer();
  
  // Simula atividade
  setInterval(() => {
    if (agentStatus.status === 'working') {
      console.log(`⏳ Trabalhando em: ${agentStatus.task}`);
    }
  }, 10000);
}
