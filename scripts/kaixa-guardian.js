#!/usr/bin/env node
// kaixa-guardian.js - Sistema de gestão saudável de agentes Kaixa
// Última atualização: 2026-02-03
// Uso: node scripts/kaixa-guardian.js [--silent|-s]

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    maxAgents: 2,          // Matches openclaw.json maxConcurrent
    maxTokensPerAgent: 180000,
    warningTokens: 150000,
    checkInterval: 300000, // 5 minutos (cron interval)
    reportDir: 'scripts/reports',
    silentMode: process.argv.includes('--silent') || process.argv.includes('-s')
};

function getSessionStatus() {
    try {
        const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
        return JSON.parse(output);
    } catch {
        return { sessions: [] };
    }
}

function isCronSession(sessionKey) {
    return sessionKey && sessionKey.includes(':cron:');
}

function analyzeHealth() {
    const status = getSessionStatus();
    
    let totalTokens = 0;
    let agentCount = 0;
    let cronCount = 0;
    let warnings = [];
    
    status.sessions.forEach(s => {
        // Ignorar sessões de cron - são temporárias e esperadas
        if (isCronSession(s.key)) {
            cronCount++;
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
        warnings,
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

function ensureReportDir() {
    const dir = path.join(process.cwd(), CONFIG.reportDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

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
        action: health.action || null
    });
    
    // Manter apenas últimos 50 registros
    if (reports.length > 50) reports = reports.slice(-50);
    
    fs.writeFileSync(filepath, JSON.stringify(reports, null, 2));
}

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
