#!/usr/bin/env node
// repo-init.js - Inicializa e organiza o repositório do Kaixa
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

function main() {
    console.log('\n🦊 REPO INIT - Organizando repositório do Kaixa\n');
    console.log('─'.repeat(50));
    
    // Verificar status atual
    const branch = run('git branch --show-current') || 'unknown';
    const status = run('git status --short') || '';
    const files = status.split('\n').filter(l => l.trim());
    
    console.log(`📁 Branch: ${branch}`);
    console.log(`📊 Arquivos pendentes: ${files.length}`);
    console.log('─'.repeat(50));
    
    if (files.length === 0) {
        console.log('✅ Nada para commitar');
        return;
    }
    
    // Categorizar arquivos
    const categories = {
        scripts: files.filter(f => f.includes('scripts/')),
        docs: files.filter(f => f.endsWith('.md') && !f.includes('improvements/')),
        improvements: files.filter(f => f.includes('memory/improvements/')),
        memory: files.filter(f => f.includes('memory/') && !f.includes('improvements/')),
        other: files.filter(f => !f.includes('scripts/') && !f.endsWith('.md') && !f.includes('memory/'))
    };
    
    console.log('\n📂 Por categoria:');
    Object.entries(categories).forEach(([cat, items]) => {
        if (items.length > 0) {
            console.log(`   ${cat}: ${items.length} arquivo(s)`);
        }
    });
    
    // Gerar mensagem de commit
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const message = `[kaixa-${timestamp}] Batch: ${files.length} arquivos - scripts, docs, melhorias`;
    
    console.log('\n💬 Mensagem de commit:');
    console.log(`   ${message}`);
    
    console.log('\n─'.repeat(50));
    console.log('📋 Próximos passos:');
    console.log('   1. git add .');
    console.log(`   2. git commit -m "${message}"`);
    console.log('   3. git push origin main (quando backpressure liberar)');
    console.log('─'.repeat(50));
    console.log();
    
    // Executar commit automaticamente
    console.log('🚀 Executando commit...\n');
    
    try {
        run('git add .');
        console.log('✅ git add .');
        
        const commitOutput = run(`git commit -m "${message}"`);
        console.log('✅ Commit realizado');
        console.log(`   ${commitOutput?.split('\n')[0] || ''}`);
        
        console.log('\n🎉 Repositório organizado com sucesso!');
        console.log(`   ${files.length} arquivos versionados`);
        
    } catch (e) {
        console.log('❌ Erro no commit:', e.message);
    }
    
    console.log();
}

main();
