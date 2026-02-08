#!/usr/bin/env node
/**
 * Kaixa Jr - AgentCorp Health Check
 * Monitora e recupera workers do AgentCorp automaticamente
 * 
 * @module scripts/health/agentcorp-health
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  maxWorkerAge: 30 * 60 * 1000, // 30 minutos (timeout padrão)
  restartDelay: 5000, // 5 segundos entre restarts
  reportDir: 'scripts/reports',
  logFile: 'scripts/reports/agentcorp-health.log'
};

/**
 * Lista sessões ativas do AgentCorp
 * @returns {Array} Lista de sessões
 */
function listAgentCorpSessions() {
  try {
    const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
    const data = JSON.parse(output);
    
    return (data.sessions || []).filter(s => 
      s.key && (
        s.key.includes('agentCorp') || 
        s.command?.includes('agentCorpWorker')
      )
    );
  } catch (e) {
    console.error('❌ Erro ao listar sessões:', e.message);
    return [];
  }
}

/**
 * Verifica se uma sessão está healthy (não travada)
 * @param {Object} session - Sessão a verificar
 * @returns {boolean} True se healthy
 */
function isSessionHealthy(session) {
  // Se tem activeAt, verifica se não está stale
  if (session.activeAt) {
    const activeTime = new Date(session.activeAt).getTime();
    const now = Date.now();
    const age = now - activeTime;
    
    // Se está ativa há mais de maxWorkerAge, pode estar travada
    if (age > CONFIG.maxWorkerAge) {
      return false;
    }
  }
  
  // Se tem status explícito
  if (session.status === 'error' || session.status === 'crashed') {
    return false;
  }
  
  return true;
}

/**
 * Reinicia uma sessão falha
 * @param {string} sessionKey - Chave da sessão
 */
function restartSession(sessionKey) {
  try {
    console.log(`🔄 Reiniciando sessão: ${sessionKey}`);
    
    // Mata a sessão antiga
    try {
      execSync(`openclaw sessions kill ${sessionKey}`, { encoding: 'utf8' });
      console.log(`  ✋ Sessão antiga encerrada`);
    } catch {
      console.log(`  ⚠️  Sessão já estava morta`);
    }
    
    // Aguarda um pouco
    setTimeout(() => {}, CONFIG.restartDelay);
    
    // Inicia nova sessão
    const newSession = execSync(
      'openclaw sessions spawn --agent-id kaixa --label agentcorp-worker "node server/agentCorpWorker.js"',
      { encoding: 'utf8' }
    );
    
    console.log(`  ✅ Nova sessão iniciada`);
    return true;
  } catch (e) {
    console.error(`  ❌ Erro ao reiniciar: ${e.message}`);
    return false;
  }
}

/**
 * Gera relatório de saúde
 * @param {Object} health - Dados de saúde
 */
function saveHealthReport(health) {
  const reportDir = path.join(process.cwd(), CONFIG.reportDir);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `agentcorp-health-${new Date().toISOString().slice(0, 10)}.json`;
  const filepath = path.join(reportDir, filename);
  
  let reports = [];
  if (fs.existsSync(filepath)) {
    try {
      reports = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch {}
  }
  
  reports.push({
    timestamp: new Date().toISOString(),
    total: health.total,
    healthy: health.healthy,
    unhealthy: health.unhealthy,
    restarted: health.restarted,
    status: health.status
  });
  
  // Manter apenas últimos 100 registros
  if (reports.length > 100) {
    reports = reports.slice(-100);
  }
  
  fs.writeFileSync(filepath, JSON.stringify(reports, null, 2));
}

/**
 * Loga mensagem com timestamp
 * @param {string} message - Mensagem
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  // Append no log
  const logDir = path.dirname(CONFIG.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(CONFIG.logFile, line);
}

/**
 * Executa health check completo
 */
function runHealthCheck() {
  log('\n' + '='.repeat(60));
  log(`🦊 AgentCorp Health Check - ${new Date().toLocaleString()}`);
  log('='.repeat(60));
  
  const sessions = listAgentCorpSessions();
  
  if (sessions.length === 0) {
    log('\n⚠️  Nenhuma sessão AgentCorp encontrada');
    log('   Inicie com: openclaw sessions spawn --agent-id kaixa --label agentcorp-worker "node server/agentCorpWorker.js"');
    
    saveHealthReport({
      total: 0,
      healthy: 0,
      unhealthy: 0,
      restarted: 0,
      status: 'no-workers'
    });
    
    return;
  }
  
  log(`\n📊 Total de workers: ${sessions.length}`);
  
  let healthy = 0;
  let unhealthy = 0;
  let restarted = 0;
  
  sessions.forEach(session => {
    const isHealthy = isSessionHealthy(session);
    const statusIcon = isHealthy ? '✅' : '❌';
    
    log(`\n${statusIcon} ${session.key}`);
    log(`   Status: ${session.status || 'unknown'}`);
    log(`   Tokens: ${(session.totalTokens / 1000).toFixed(1)}k`);
    
    if (session.activeAt) {
      const age = Date.now() - new Date(session.activeAt).getTime();
      const ageMin = Math.floor(age / 60000);
      log(`   Ativa há: ${ageMin}min`);
    }
    
    if (isHealthy) {
      healthy++;
    } else {
      unhealthy++;
      log('   🔄 Reiniciando...');
      
      if (restartSession(session.key)) {
        restarted++;
      }
    }
  });
  
  const overallStatus = unhealthy === 0 ? 'healthy' : unhealthy < sessions.length / 2 ? 'degraded' : 'critical';
  
  log('\n' + '-'.repeat(60));
  log(`📈 Resumo:`);
  log(`   Total: ${sessions.length}`);
  log(`   Healthy: ${healthy} ✅`);
  log(`   Unhealthy: ${unhealthy} ❌`);
  log(`   Reiniciados: ${restarted} 🔄`);
  log(`   Status geral: ${overallStatus.toUpperCase()}`);
  log('='.repeat(60) + '\n');
  
  saveHealthReport({
    total: sessions.length,
    healthy,
    unhealthy,
    restarted,
    status: overallStatus
  });
  
  return {
    total: sessions.length,
    healthy,
    unhealthy,
    restarted,
    status: overallStatus
  };
}

// Executa se chamado diretamente
if (require.main === module) {
  runHealthCheck();
}

module.exports = { runHealthCheck, listAgentCorpSessions, isSessionHealthy };
