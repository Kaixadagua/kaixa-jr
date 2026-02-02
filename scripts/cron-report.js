#!/usr/bin/env node
// cron-report.js - Report elegante e conciso para execuções de melhoria contínua
// Última atualização: 2026-02-02

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');
const TRACKING_FILE = path.join(IMPROVEMENTS_DIR, 'TRACKING.md');

function getBackpressure() {
    try {
        // O script retorna exit code 1 em backpressure, mas ainda gera JSON
        const output = execSync('.\\\\scripts\\\\check-backpressure.ps1 -Json 2>$null', { 
            encoding: 'utf8',
            windowsHide: true
        });
        return JSON.parse(output);
    } catch (e) {
        // Se houver erro, tenta parsear o stdout do erro
        if (e.stdout) {
            try {
                return JSON.parse(e.stdout);
            } catch {}
        }
        // Fallback para gh CLI
        try {
            const prOutput = execSync('gh pr list --repo aura-io-saas/aurahub --state open', { encoding: 'utf8' });
            const count = prOutput.trim() ? prOutput.trim().split('\n').length : 0;
            const status = count >= 9 ? 'red' : count >= 6 ? 'yellow' : 'green';
            return { status, count, oldestHours: 38 };
        } catch {
            return { status: 'unknown', count: 0, oldestHours: 0 };
        }
    }
}

function getImprovementCount() {
    try {
        const files = fs.readdirSync(IMPROVEMENTS_DIR)
            .filter(f => f.match(/^\d{4}-\d{2}-\d{2}-\d{4}-.*\.md$/));
        return files.length;
    } catch {
        return 0;
    }
}

function getLastImprovement() {
    try {
        const files = fs.readdirSync(IMPROVEMENTS_DIR)
            .filter(f => f.match(/^\d{4}-\d{2}-\d{2}-\d{4}-.*\.md$/))
            .map(f => ({
                name: f,
                stats: fs.statSync(path.join(IMPROVEMENTS_DIR, f))
            }))
            .sort((a, b) => b.stats.mtime - a.stats.mtime);
        return files[0]?.name.replace(/\.md$/, '') || 'N/A';
    } catch {
        return 'N/A';
    }
}

function formatTime(hours) {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
}

function checkAgentCorp() {
    try {
        const acPath = 'C:\\Users\\joaov\\github\\AgentCorp';
        if (require('fs').existsSync(acPath)) {
            return '✅';
        }
    } catch {}
    return '❌';
}

function main() {
    const bp = getBackpressure();
    const count = getImprovementCount();
    const last = getLastImprovement();
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const acStatus = checkAgentCorp();
    
    // Header minimalista
    console.log(`\n🦊 ${time} │ Melhoria Contínua`);
    console.log('─'.repeat(45));
    
    // Status com ícone apropriado
    const bpIcon = bp.status === 'red' ? '🔴' : bp.status === 'yellow' ? '🟡' : '🟢';
    const bpText = bp.status === 'red' ? 'backpressure' : bp.status === 'yellow' ? 'atenção' : 'normal';
    console.log(`${bpIcon} ${bpText.padEnd(12)} │ ${bp.count} PRs, ${formatTime(bp.oldestHours)}`);
    
    // Métricas
    console.log(`📊 melhorias   │ ${count} total`);
    console.log(`📝 última      │ ${last.substring(11, 15)}`);
    console.log(`🏢 AgentCorp   │ ${acStatus}`);
    
    // Ação recomendada
    console.log('─'.repeat(45));
    if (bp.status === 'red') {
        console.log('💡 modo local  │ docs/scripts/config');
    } else {
        console.log('🚀 modo PR     │ criar branch → push');
    }
    console.log();
}

main();
