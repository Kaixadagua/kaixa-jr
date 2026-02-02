#!/usr/bin/env node
// agent-guardian.js - Sistema de gestão saudável de agentes
// Última atualização: 2026-02-02

const { execSync } = require('child_process');

const CONFIG = {
    maxAgents: 1,
    maxTokensPerAgent: 180000,
    warningTokens: 150000,
    checkInterval: 30000,
    cooldownAfterFlush: 60000
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
        status: 'healthy'
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

function main() {
    console.log('\n🦊 Agent Guardian - Gestão Saudável\n');
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
    
    console.log('─'.repeat(50));
    console.log();
}

main();
