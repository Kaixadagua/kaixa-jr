/**
 * @fileoverview Kaixa Jr Agent Server - API HTTP para integração com AgentCorp
 * @description Servidor HTTP leve que expõe status e health check do agente Kaixa Jr.
 *              Permite integração com sistemas externos via endpoints REST.
 *              Escuta em 0.0.0.0 para compatibilidade com Docker/containers.
 * @author Kaixa Jr 🦊
 * @version 1.0.3
 * @module server/agentServer
 */

const http = require('http');
const { getConfig } = require('../src/core/config');

const config = getConfig();
const PORT = process.env.AGENT_PORT || 5000;

/**
 * Status atual do agente Kaixa Jr
 * @typedef {Object} AgentStatus
 * @property {string} id - Identificador único do agente
 * @property {string} name - Nome do agente
 * @property {string} surname - Sobrenome/tipo do agente
 * @property {string} emoji - Representação emoji do agente
 * @property {'idle'|'working'|'busy'} status - Estado atual do agente
 * @property {string|null} task - Tarefa em execução ou null
 * @property {number} tasks_completed - Total de tarefas finalizadas
 * @property {number} energy - Nível de energia (0-100)
 * @property {number} health - Nível de saúde (0-100)
 * @property {number} happiness - Nível de felicidade (0-100)
 * @property {number} efficiency - Eficiência atual (0-100)
 * @property {number} last_active - Timestamp da última atividade (ms)
 * @property {string[]} capabilities - Lista de capacidades do agente
 * @property {string} version - Versão do agente
 */

/** @type {AgentStatus} */
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
 * Incrementa contador de tarefas completadas
 * Atualiza status para 'idle' e limpa tarefa atual
 * @returns {number} Novo total de tarefas completadas
 */
function completeTask() {
  agentStatus.tasks_completed++;
  agentStatus.status = 'idle';
  agentStatus.task = null;
  agentStatus.last_active = Date.now();
  console.log(`✅ Tarefa completada! Total: ${agentStatus.tasks_completed}`);
}

/**
 * Cria e inicia servidor HTTP para API do agente
 * IMPORTANTE: Escuta em '0.0.0.0' para permitir acesso do Docker
 * 
 * @returns {http.Server} Instância do servidor HTTP criado
 * @example
 * const server = createServer();
 * // Servidor rodando em http://0.0.0.0:5000
 */
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

/**
 * Obtém cópia do status atual do agente
 * @returns {AgentStatus} Cópia do estado atual do agente
 */
function getStatus() {
  return { ...agentStatus };
}

/**
 * Exportações do módulo
 * @namespace AgentServerAPI
 */
module.exports = {
  /** @type {Function} Cria servidor HTTP */
  createServer,
  /** @type {Function} Atualiza status do agente */
  updateStatus,
  /** @type {Function} Marca tarefa como completa */
  completeTask,
  /** @type {Function} Obtém status atual */
  getStatus
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
