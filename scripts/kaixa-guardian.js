#!/usr/bin/env node
/**
 * @fileoverview Kaixa Guardian - Sistema de gestão saudável de agentes
 * @description Monitora sessões do OpenClaw, tokens e saúde do sistema
 * @author Kaixa Jr 🦊
 * @version 1.3.0
 * @usage node scripts/kaixa-guardian.js [--silent|-s]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Configuração do Guardian
 * @constant {Object}
 * @property {number} maxAgents - Máximo de agentes simultâneos
 * @property {number} maxTokensPerAgent - Limite de tokens por agente
 * @property {number} warningTokens - Threshold de alerta de tokens
 * @property {number} checkInterval - Intervalo de verificação (ms)
 * @property {string} reportDir - Diretório de relatórios
 * @property {boolean} silentMode - Modo silencioso para cron
 */
const CONFIG = {
    maxAgents: 2,
    maxTokensPerAgent: 180000,
    warningTokens: 150000,
    checkInterval: 300000,
    reportDir: 'scripts/reports',
    silentMode: process.argv.includes('--silent') || process.argv.includes('-s')
};

/**
 * Obtém lista de sessões do OpenClaw via CLI
 * @returns {Object} Objeto com array de sessões { sessions: [] }
 */
function getSessionStatus() {
    try {
        const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
        return JSON.parse(output);
    } catch {
        return { sessions: [] };
    }
}

/**
 * Verifica backpressure de PRs no repositório kaixa-jr
 * @returns {Object} Status de backpressure { count: number, status: string }
 * @property {number} count - Quantidade de PRs abertos
 * @property {string} status - 'green'|'yellow'|'red' baseado nos thresholds
 */
function checkBackpressure() {
    try {
        const output = execSync('gh pr list --repo Kaixadagua/kaixa-jr --state open --json number', { 
            encoding: 'utf8',
            timeout: 10000 
        });
        const prs = JSON.parse(output);
        const count = prs.length;
        
        let status = 'green';
        if (count >= 9) status = 'red';
        else if (count >= 6) status = 'yellow';
        
        return { count, status };
    } catch {
        return { count: -1, status: 'unknown' };
    }
}

/**
 * Verifica se uma chave de sessão pertence a um cron job
 * @param {string} sessionKey - Chave da sessão
 * @returns {boolean} True se for sessão de cron
 */
function isCronSession(sessionKey) {
    return sessionKey && sessionKey.includes(':cron:');
}

/**
 * Analisa saúde do sistema baseado nas sessões ativas
 * @returns {Object} Status de saúde com agentes, tokens e alertas
 * @property {number} agentCount - Quantidade de subagentes
 * @property {number} totalTokens - Total de tokens em uso
 * @property {number} systemCount - Sessões de sistema ignoradas
 * @property {string[]} warnings - Lista de alertas
 * @property {string} status - Estado: 'healthy'|'warning'|'critical'
 * @property {string} [action] - Ação recomendada se necessário
 * @property {string} timestamp - ISO timestamp da análise
 * @property {Object} backpressure - Status de PRs { count, status }
 */
function analyzeHealth() {
    const status = getSessionStatus();
    const backpressure = checkBackpressure();
    
    let totalTokens = 0;
    let agentCount = 0;
    let cronCount = 0;
    let systemCount = 0;
    let warnings = [];
    
    status.sessions.forEach(s => {
        // Ignorar sessões de cron - são temporárias e esperadas
        if (isCronSession(s.key)) {
            cronCount++;
            return;
        }
        
        // Contar APENAS subagentes reais (kind: "subagent")
        // Sessão principal (main) e outras de sistema não contam
        if (s.kind !== 'subagent') {
            systemCount++;
            return;
        }
        
        totalTokens += s.totalTokens || 0;
        agentCount++;
        
        if (s.totalTokens > CONFIG.maxTokensPerAgent) {
            warnings.push(`⚠️  ${s.key}: ${(s.totalTokens/1000).toFixed(0)}k tokens`);
        }
    });
    
    const health = {
        agentCount,
        totalTokens,
        systemCount,
        warnings,
        backpressure,
        status: 'healthy',
        timestamp: new Date().toISOString()
    };
    
    if (agentCount > CONFIG.maxAgents) {
        health.status = 'critical';
        health.action = 'reduce-agents';
    } else if (totalTokens > CONFIG.warningTokens * CONFIG.maxAgents) {
        health.status = 'warning';
        health.action = 'flush-context';
    }
    
    return health;
}

/**
 * Garante que o diretório de relatórios existe
 * @returns {string} Caminho absoluto do diretório de relatórios
 */
function ensureReportDir() {
    const dir = path.join(process.cwd(), CONFIG.reportDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Carrega histórico de relatórios do dia
 * @returns {Object[]} Array de entradas de saúde anteriores
 */
function loadHistory() {
    const reportDir = ensureReportDir();
    const filename = `guardian-${new Date().toISOString().slice(0,10)}.json`;
    const filepath = path.join(reportDir, filename);
    
    if (fs.existsSync(filepath)) {
        try {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch {}
    }
    return [];
}

/**
 * Calcula tendência de tokens e agentes comparando com histórico
 * @param {Object[]} history - Histórico de análises
 * @param {Object} current - Análise atual
 * @returns {Object} Tendências { tokens: string, agents: string }
 */
function calculateTrend(history, current) {
    if (history.length < 2) return { tokens: 'stable', agents: 'stable' };
    
    const prev = history[history.length - 1];
    const tokenDiff = current.totalTokens - prev.totalTokens;
    const agentDiff = current.agentCount - prev.agentCount;
    
    return {
        tokens: tokenDiff > 10000 ? 'rising' : tokenDiff < -10000 ? 'falling' : 'stable',
        agents: agentDiff > 0 ? 'rising' : agentDiff < 0 ? 'falling' : 'stable'
    };
}

/**
 * Salva relatório de saúde no arquivo JSON diário
 * @param {Object} health - Dados de saúde atual
 * @param {string} health.timestamp - Timestamp ISO
 * @param {number} health.agentCount - Contagem de agentes
 * @param {number} health.totalTokens - Total de tokens
 * @param {string} health.status - Status de saúde
 * @param {string} [health.action] - Ação recomendada
 */
function saveReport(health) {
    const reportDir = ensureReportDir();
    const filename = `guardian-${new Date().toISOString().slice(0,10)}.json`;
    const filepath = path.join(reportDir, filename);
    
    let reports = [];
    if (fs.existsSync(filepath)) {
        try {
            reports = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch {}
    }
    
    reports.push({
        timestamp: health.timestamp,
        agentCount: health.agentCount,
        totalTokens: health.totalTokens,
        status: health.status,
        action: health.action || null,
        backpressure: health.backpressure
    });
    
    // Manter apenas últimos 50 registros
    if (reports.length > 50) reports = reports.slice(-50);
    
    fs.writeFileSync(filepath, JSON.stringify(reports, null, 2));
}

/**
 * Função principal - executa análise e exibe relatório
 * @returns {void}
 */
function main() {
    const health = analyzeHealth();
    const history = loadHistory();
    const trend = calculateTrend(history, health);
    
    // Modo silencioso para cron - só sai se houver problema
    if (CONFIG.silentMode && health.status === 'healthy') {
        saveReport(health);
        process.exit(0);
    }
    
    console.log('\n🦊 Kaixa Guardian - Gestão Saudável\n');
    console.log('─'.repeat(50));
    
    console.log(`📊 Agentes: ${health.agentCount}/${CONFIG.maxAgents}`);
    console.log(`💾 Tokens: ${(health.totalTokens/1000).toFixed(0)}k/${(CONFIG.maxTokensPerAgent * CONFIG.maxAgents / 1000).toFixed(0)}k`);
    console.log(`📈 Status: ${health.status.toUpperCase()}`);
    
    // Exibir backpressure
    const bpIcon = { green: '🟢', yellow: '🟡', red: '🔴', unknown: '⚪' };
    const bpLabel = health.backpressure.count >= 0 ? `${health.backpressure.count} PRs` : 'N/A';
    console.log(`   ${bpIcon[health.backpressure.status]} Backpressure: ${bpLabel}`);
    
    if (health.systemCount > 0) {
        console.log(`   🖥️  Sessões sistema ignoradas: ${health.systemCount}`);
    }
    
    // Mostrar tendências
    if (history.length > 0) {
        const trendIcon = {
            rising: '📈',
            falling: '📉',
            stable: '➡️'
        };
        console.log(`   ${trendIcon[trend.tokens]} Tokens: ${trend.tokens}`);
    }
    
    if (health.warnings.length > 0) {
        console.log('\n⚠️  Alertas:');
        health.warnings.forEach(w => console.log(`   ${w}`));
    }
    
    if (health.action) {
        console.log(`\n💡 Ação recomendada: ${health.action}`);
        
        if (health.action === 'flush-context') {
            console.log('   → Use /compact ou aguarde auto-flush');
        } else if (health.action === 'reduce-agents') {
            console.log(`   → Limite: ${CONFIG.maxAgents} agente(s) máximo`);
        }
    } else {
        console.log('\n✅ Sistema saudável');
    }
    
    // Salvar relatório
    saveReport(health);
    
    console.log('─'.repeat(50));
    console.log();
}

main();

// ============================================================
// UTILIDADES ADICIONADAS POR MELHORIA CONTÍNUA
// ============================================================

/**
 * Formata uma duração em milissegundos para string legível
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Duração formatada (ex: "2h 30m", "45s", "5d 12h")
 * @example
 * formatDuration(900000) // "15m"
 * formatDuration(86400000) // "1d"
 * formatDuration(3661000) // "1h 1m"
 */
function formatDuration(ms) {
    if (ms < 0) return '0s';
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
}

/**
 * Calcula tempo relativo desde um timestamp
 * @param {string|Date|number} timestamp - Timestamp de referência
 * @returns {string} Tempo relativo (ex: "há 2 minutos", "há 1 hora")
 * @example
 * timeAgo(Date.now() - 120000) // "há 2 minutos"
 * timeAgo('2026-02-08T23:00:00Z') // "há 30 minutos"
 */
function timeAgo(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return days === 1 ? 'há 1 dia' : `há ${days} dias`;
    if (hours > 0) return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
    if (minutes > 0) return minutes === 1 ? 'há 1 minuto' : `há ${minutes} minutos`;
    return 'agora mesmo';
}

/**
 * Exporta utilitários para uso em outros módulos
 * @namespace GuardianUtils
 */
const GuardianUtils = {
    formatDuration,
    timeAgo,
    isCronSession,
    checkBackpressure
};

// Exporta para módulos Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuardianUtils, formatDuration, timeAgo };
}
