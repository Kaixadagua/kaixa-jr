#!/usr/bin/env node
// scripts-index.js - Índice interativo de todos os scripts disponíveis
// Última atualização: 2026-02-02

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

const SCRIPTS = [
    {
        file: 'melhoria-status.js',
        type: 'node',
        category: 'dashboard',
        desc: 'Dashboard completo de melhorias',
        cmd: 'node scripts/melhoria-status.js'
    },
    {
        file: 'cron-report.js',
        type: 'node',
        category: 'report',
        desc: 'Report elegante para cron',
        cmd: 'node scripts/cron-report.js'
    },
    {
        file: 'scripts-index.js',
        type: 'node',
        category: 'index',
        desc: 'Índice interativo de scripts',
        cmd: 'node scripts/scripts-index.js'
    },
    {
        file: 'agent-guardian.js',
        type: 'node',
        category: 'monitoring',
        desc: 'Gestão saudável de agentes',
        cmd: 'node scripts/agent-guardian.js'
    },
    {
        file: 'context-compactor.js',
        type: 'node',
        category: 'diagnostic',
        desc: 'Gestão de contexto',
        cmd: 'node scripts/context-compactor.js'
    },
    {
        file: 'health-check.js',
        type: 'node',
        category: 'diagnostic',
        desc: 'Saúde do ambiente',
        cmd: 'node scripts/health-check.js'
    },
    {
        file: 'auto-commit.js',
        type: 'node',
        category: 'git',
        desc: 'Auxilia commits',
        cmd: 'node scripts/auto-commit.js'
    },
    {
        file: 'melhoria-consolidator.js',
        type: 'node',
        category: 'batch',
        desc: 'Consolida para batch PR',
        cmd: 'node scripts/melhoria-consolidator.js'
    },
    {
        file: 'repo-init.js',
        type: 'node',
        category: 'infra',
        desc: 'Inicialização do repositório',
        cmd: 'node scripts/repo-init.js'
    },
    {
        file: 'check-backpressure.ps1',
        type: 'powershell',
        category: 'monitoring',
        desc: 'Verifica backlog de PRs',
        cmd: '.\\scripts\\check-backpressure.ps1 -VerboseOutput'
    },
    {
        file: 'git-sync.ps1',
        type: 'powershell',
        category: 'git',
        desc: 'Sincronização segura',
        cmd: '.\\scripts\\git-sync.ps1'
    },
    {
        file: 'status.bat',
        type: 'batch',
        category: 'quick',
        desc: 'Status rápido do sistema',
        cmd: '.\\status.bat'
    }
];

function showIndex() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     🦊 SCRIPTS INDEX - Kaixa Jr          ║');
    console.log('╚══════════════════════════════════════════╝\n');
    
    // Agrupar por categoria
    const byCategory = {};
    SCRIPTS.forEach(s => {
        if (!byCategory[s.category]) byCategory[s.category] = [];
        byCategory[s.category].push(s);
    });
    
    Object.entries(byCategory).forEach(([cat, scripts]) => {
        const icon = cat === 'dashboard' ? '📊' :
                     cat === 'report' ? '📋' :
                     cat === 'diagnostic' ? '🔍' :
                     cat === 'git' ? '🔀' :
                     cat === 'batch' ? '📦' :
                     cat === 'monitoring' ? '👁️' :
                     cat === 'quick' ? '⚡' : '📜';
        
        console.log(`${icon} ${cat.toUpperCase()}`);
        scripts.forEach(s => {
            const typeIcon = s.type === 'node' ? '●' : s.type === 'powershell' ? '○' : '□';
            console.log(`   ${typeIcon} ${s.file.padEnd(28)} │ ${s.desc}`);
        });
        console.log();
    });
    
    console.log('─'.repeat(50));
    console.log('Legenda: ● Node.js  ○ PowerShell  □ Batch');
    console.log('─'.repeat(50));
    console.log();
}

function main() {
    showIndex();
}

main();
