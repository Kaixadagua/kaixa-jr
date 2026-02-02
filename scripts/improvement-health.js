#!/usr/bin/env node
// improvement-health.js - Verifica a saúde do sistema de melhorias
// Última atualização: 2026-02-02

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch {
        return '';
    }
}

function checkHealth() {
    console.log('\n🦊 Improvement System Health Check\n');
    console.log('─'.repeat(50));
    
    // Verificar melhorias
    const improvements = fs.readdirSync(IMPROVEMENTS_DIR)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}-.*\.md$/));
    
    console.log(`✅ Registros: ${improvements.length} melhorias`);
    
    // Verificar commits
    const log = run('git log --oneline -1');
    console.log(`✅ Último commit: ${log.substring(0, 40)}`);
    
    // Verificar status git
    const status = run('git status --short');
    const pending = status ? status.split('\n').length : 0;
    
    if (pending > 0) {
        console.log(`⚠️  Pendentes: ${pending} arquivo(s)`);
    } else {
        console.log(`✅ Working dir: limpo`);
    }
    
    // Backpressure
    try {
        const bp = JSON.parse(run('.\\\\scripts\\\\check-backpressure.ps1 -Json 2>$null'));
        const icon = bp.status === 'red' ? '🔴' : bp.status === 'yellow' ? '🟡' : '🟢';
        console.log(`${icon} Backpressure: ${bp.count} PRs (${Math.round(bp.oldestHours)}h)`);
    } catch {
        console.log('⚠️  Backpressure: não verificado');
    }
    
    console.log('─'.repeat(50));
    console.log();
}

checkHealth();
