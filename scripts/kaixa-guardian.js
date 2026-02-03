#!/usr/bin/env node
// kaixa-guardian.js - Sistema de gestão saudável de agentes Kaixa
// Última atualização: 2026-02-03

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    maxAgents: 1,
    maxTokensPerAgent: 180000,
    warningTokens: 150000,
    checkInterval: 300000, // 5 minutos (cron interval)
    reportDir: 'scripts/reports'
};

function getSessionStatus() {
    try {
        const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
        return JSON.parse(output);
    } catch {
        return { sessions: [] };
    }
}

function analyzeHealth() {
    const status = getSessionStatus();
    
    let totalTokens = 0;
    let agentCount = 0;
    let warnings = [];
    
    status.sessions.forEach(s => {
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
    console.log('\n🦊 Kaixa Guardian - Gestão Saudável\n');
    console.log('─'.repeat(50));
    
    const health = analyzeHealth();
    
    console.log(`📊 Agentes: ${health.agentCount}/${CONFIG.maxAgents}`);
    console.log(`💾 Tokens: ${(health.totalTokens/1000).toFixed(0)}k/${(CONFIG.maxTokensPerAgent * CONFIG.maxAgents / 1000).toFixed(0)}k`);
    console.log(`📈 Status: ${health.status.toUpperCase()}`);
    
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
