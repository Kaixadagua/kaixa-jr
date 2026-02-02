#!/usr/bin/env node
// auto-commit.js - Automatiza commits durante melhoria contínua
// Última atualização: 2026-02-02

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = 'C:\\Users\\joaov\\.openclaw\\workspace';

function run(cmd, cwd = WORKSPACE) {
    try {
        return execSync(cmd, { encoding: 'utf8', cwd }).trim();
    } catch (e) {
        return null;
    }
}

function getChangedFiles() {
    const output = run('git status --short');
    if (!output) return [];
    return output.split('\n').filter(line => line.trim());
}

function categorizeFile(file) {
    if (file.includes('memory/improvements/')) return '📝 Melhoria';
    if (file.includes('scripts/')) return '🔧 Script';
    if (file.includes('skills/')) return '🎓 Skill';
    if (file.endsWith('.md')) return '📚 Docs';
    if (file.endsWith('.json')) return '⚙️ Config';
    return '📦 Outro';
}

function generateCommitMessage(files) {
    const categories = {};
    files.forEach(f => {
        const cat = categorizeFile(f);
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const primary = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0];
    
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `[melhoria-${timestamp}] ${primary[0]}: ${files.length} arquivo(s)`;
}

function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║     🦊 AUTO-COMMIT MELHORIAS         ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    // Verificar branch
    const branch = run('git branch --show-current');
    console.log(`Branch: ${branch}`);
    
    // Verificar arquivos modificados
    const files = getChangedFiles();
    
    if (files.length === 0) {
        console.log('\n✅ Nenhuma alteração pendente');
        return;
    }
    
    console.log(`\n📁 Arquivos modificados: ${files.length}\n`);
    files.slice(0, 10).forEach(f => {
        const status = f.substring(0, 2).trim();
        const file = f.substring(3).trim();
        const cat = categorizeFile(file);
        console.log(`  [${status}] ${cat} ${path.basename(file)}`);
    });
    
    if (files.length > 10) {
        console.log(`  ... e mais ${files.length - 10} arquivo(s)`);
    }
    
    // Verificar backpressure via gh
    console.log('\n📊 Backpressure:');
    try {
        const prOutput = run('gh pr list --repo aura-io-saas/aurahub --state open');
        const prCount = prOutput ? prOutput.split('\n').filter(l => l.trim()).length : 0;
        const status = prCount >= 9 ? '🔴' : prCount >= 6 ? '🟡' : '🟢';
        const warning = prCount >= 9 ? '\n  ⚠️  BACKPRESSURE ATIVO - Commit local recomendado' : '';
        console.log(`  ${status} ${prCount} PRs abertos${warning}`);
    } catch {
        console.log('  ⚠️  Não verificado');
    }
    
    // Gerar mensagem de commit
    const message = generateCommitMessage(files.map(f => f.substring(3).trim()));
    console.log(`\n💬 Mensagem sugerida:`);
    console.log(`   ${message}`);
    
    console.log('\n───────────────────────────────────────');
    console.log('Comandos:');
    console.log('  git add .');
    console.log(`  git commit -m "${message}"`);
    console.log('───────────────────────────────────────\n');
}

main();
