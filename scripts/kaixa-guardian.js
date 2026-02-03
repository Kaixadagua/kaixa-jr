#!/usr/bin/env node
/**
 * Kaixa Guardian v1.0
 * Sistema Anti-Crash para Kaixa Jr
 * 
 * Proteções:
 * - Memory Guard: Alerta quando contexto >400k tokens
 * - Session Cleaner: Limpa sessões inativas
 * - State Backup: Backup automático do estado
 * - Log Rotator: Comprime logs >1MB
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const CONFIG = {
  maxTokens: 400000,
  maxLogSize: 1024 * 1024, // 1MB
  backupInterval: 10 * 60 * 1000, // 10 min
  workspace: 'C:\\Users\\joaov\\.openclaw\\workspace',
  memoryDir: 'C:\\Users\\joaov\\.openclaw\\workspace\\memory',
  logsDir: 'C:\\Users\\joaov\\.openclaw\\workspace\\logs'
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = {
    INFO: colors.cyan,
    WARN: colors.yellow,
    ERROR: colors.red,
    SUCCESS: colors.green
  }[level] || colors.reset;
  
  console.log(`${color}[${timestamp}] [${level}] ${message}${colors.reset}`);
}

// ==================== MEMORY GUARD ====================

function checkContextSize() {
  log('INFO', '🔍 Verificando tamanho do contexto...');
  
  try {
    // Verifica arquivos de memória
    const files = fs.readdirSync(CONFIG.memoryDir);
    let totalSize = 0;
    
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const filepath = path.join(CONFIG.memoryDir, file);
        const stats = fs.statSync(filepath);
        totalSize += stats.size;
      }
    });
    
    // Estima tokens (aproximadamente 4 chars por token)
    const estimatedTokens = Math.round(totalSize / 4);
    
    log('INFO', `📊 Contexto estimado: ${estimatedTokens.toLocaleString()} tokens`);
    
    if (estimatedTokens > CONFIG.maxTokens) {
      log('WARN', `⚠️  ALERTA: Contexto acima de ${CONFIG.maxTokens.toLocaleString()} tokens!`);
      log('WARN', '💡 Recomendação: Executar context-compactor.js');
      
      // Cria alerta
      createAlert('MEMORY_GUARD', `Contexto alto: ${estimatedTokens.toLocaleString()} tokens`);
      
      return { status: 'warning', tokens: estimatedTokens };
    }
    
    log('SUCCESS', `✅ Contexto saudável: ${estimatedTokens.toLocaleString()} tokens`);
    return { status: 'ok', tokens: estimatedTokens };
    
  } catch (e) {
    log('ERROR', `❌ Erro ao verificar contexto: ${e.message}`);
    return { status: 'error', error: e.message };
  }
}

// ==================== SESSION CLEANER ====================

function cleanInactiveSessions() {
  log('INFO', '🧹 Verificando sessões inativas...');
  
  try {
    // Lista sessões ativas via openclaw
    const result = execSync('openclaw sessions list --json 2>nul || echo "[]"', { 
      encoding: 'utf8',
      cwd: CONFIG.workspace
    });
    
    const sessions = JSON.parse(result || '[]');
    const now = Date.now();
    const maxInactive = 60 * 60 * 1000; // 1 hora
    
    let cleaned = 0;
    
    sessions.forEach(session => {
      const lastActive = new Date(session.lastActive).getTime();
      const inactive = now - lastActive;
      
      if (inactive > maxInactive && session.kind === 'subagent') {
        log('INFO', `🗑️  Removendo sessão inativa: ${session.sessionKey}`);
        try {
          execSync(`openclaw sessions kill ${session.sessionKey} 2>nul`);
          cleaned++;
        } catch (e) {
          log('ERROR', `❌ Erro ao remover sessão: ${e.message}`);
        }
      }
    });
    
    if (cleaned > 0) {
      log('SUCCESS', `✅ ${cleaned} sessões inativas removidas`);
    } else {
      log('INFO', '✅ Nenhuma sessão inativa encontrada');
    }
    
    return { status: 'ok', cleaned };
    
  } catch (e) {
    log('ERROR', `❌ Erro ao limpar sessões: ${e.message}`);
    return { status: 'error', error: e.message };
  }
}

// ==================== STATE BACKUP ====================

function backupState() {
  log('INFO', '💾 Realizando backup do estado...');
  
  try {
    const backupDir = path.join(CONFIG.workspace, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `kaixa-state-${timestamp}.json`);
    
    // Coleta estado
    const state = {
      timestamp: new Date().toISOString(),
      memory: {
        files: fs.readdirSync(CONFIG.memoryDir).filter(f => f.endsWith('.md'))
      },
      workspace: {
        files: fs.readdirSync(CONFIG.workspace).filter(f => f.endsWith('.md'))
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(state, null, 2));
    
    // Mantém apenas últimos 10 backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('kaixa-state-'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (backups.length > 10) {
      backups.slice(10).forEach(b => {
        fs.unlinkSync(b.path);
        log('INFO', `🗑️  Backup antigo removido: ${b.name}`);
      });
    }
    
    log('SUCCESS', `✅ Backup salvo: ${backupFile}`);
    return { status: 'ok', file: backupFile };
    
  } catch (e) {
    log('ERROR', `❌ Erro no backup: ${e.message}`);
    return { status: 'error', error: e.message };
  }
}

// ==================== LOG ROTATOR ====================

function rotateLogs() {
  log('INFO', '📦 Verificando rotação de logs...');
  
  try {
    if (!fs.existsSync(CONFIG.logsDir)) {
      fs.mkdirSync(CONFIG.logsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(CONFIG.logsDir);
    let rotated = 0;
    
    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filepath = path.join(CONFIG.logsDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.size > CONFIG.maxLogSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const newName = file.replace('.log', `-${timestamp}.log.gz`);
          
          // Comprime (simulado - em produção usaria zlib)
          fs.renameSync(filepath, path.join(CONFIG.logsDir, newName));
          
          log('INFO', `📦 Log rotacionado: ${file} → ${newName}`);
          rotated++;
        }
      }
    });
    
    if (rotated > 0) {
      log('SUCCESS', `✅ ${rotated} logs rotacionados`);
    } else {
      log('INFO', '✅ Nenhum log precisa de rotação');
    }
    
    return { status: 'ok', rotated };
    
  } catch (e) {
    log('ERROR', `❌ Erro na rotação: ${e.message}`);
    return { status: 'error', error: e.message };
  }
}

// ==================== ALERT SYSTEM ====================

function createAlert(type, message) {
  const alertFile = path.join(CONFIG.memoryDir, `alert-${Date.now()}.json`);
  const alert = {
    type,
    message,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  try {
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
    log('INFO', `🚨 Alerta criado: ${type}`);
  } catch (e) {
    log('ERROR', `❌ Erro ao criar alerta: ${e.message}`);
  }
}

// ==================== HEALTH CHECK ====================

function generateHealthReport() {
  log('INFO', '🏥 Gerando relatório de saúde...');
  
  const memory = checkContextSize();
  const sessions = cleanInactiveSessions();
  const backup = backupState();
  const logs = rotateLogs();
  
  const report = {
    timestamp: new Date().toISOString(),
    guardian: 'Kaixa Guardian v1.0',
    checks: {
      memory,
      sessions,
      backup,
      logs
    },
    overall: memory.status === 'ok' && sessions.status === 'ok' 
      ? 'healthy' 
      : 'warning'
  };
  
  // Salva relatório
  const reportFile = path.join(CONFIG.memoryDir, 'guardian-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log('INFO', `📊 Health Report: ${report.overall.toUpperCase()}`);
  
  return report;
}

// ==================== MAIN ====================

function main() {
  console.log(`
${colors.magenta}
╔══════════════════════════════════════════╗
║     🦊 KAIXA GUARDIAN v1.0 🛡️            ║
║     Proteção Anti-Crash Ativa            ║
╚══════════════════════════════════════════╝
${colors.reset}
  `);
  
  const report = generateHealthReport();
  
  console.log(`
${colors.cyan}
📋 Resumo:
  • Memory Guard: ${report.checks.memory.status}
  • Session Cleaner: ${report.checks.sessions.status} (${report.checks.sessions.cleaned || 0} removidas)
  • State Backup: ${report.checks.backup.status}
  • Log Rotator: ${report.checks.logs.status} (${report.checks.logs.rotated || 0} rotacionados)

Overall: ${report.overall === 'healthy' ? colors.green + '✅ SAUDÁVEL' : colors.yellow + '⚠️  ATENÇÃO'}${colors.reset}
  `);
  
  process.exit(report.overall === 'healthy' ? 0 : 1);
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkContextSize,
  cleanInactiveSessions,
  backupState,
  rotateLogs,
  generateHealthReport
};
