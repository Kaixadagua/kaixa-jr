#!/usr/bin/env node
// health-check.js - Verificação rápida de saúde do ambiente
// Última atualização: 2026-02-02 - Backpressure + Sessões

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = 'C:\\Users\\joaov\\.openclaw\\workspace';
const REPO = 'aura-io-saas/aurahub';

console.log('🦊 Kaixa Jr - Health Check\n');

// Verificar git
console.log('📁 Git:');
try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: WORKSPACE }).trim();
    console.log(`  Branch: ${branch}`);
    
    const status = execSync('git status --short', { encoding: 'utf8', cwd: WORKSPACE }).trim();
    console.log(`  Changes: ${status ? `${status.split('\n').length} pendentes` : 'Limpo'}`);
} catch {
    console.log('  ⚠️  Não é um repo git');
}

// Backpressure
console.log('\n📊 Backpressure:');
try {
    const prList = execSync(`gh pr list --repo ${REPO} --state open`, { encoding: 'utf8' }).trim();
    const prCount = prList ? prList.split('\n').length : 0;
    
    let status = '🟢';
    if (prCount >= 9) status = '🔴';
    else if (prCount >= 6) status = '🟡';
    
    console.log(`  ${status} PRs abertos: ${prCount}`);
    console.log(`  Threshold: ${prCount >= 9 ? 'BACKPRESSURE ATIVO' : 'Fluxo normal'}`);
} catch {
    console.log('  ⚠️  Não foi possível verificar PRs');
}

// Verificar memória
console.log('\n🧠 Memória:');
const memDir = path.join(WORKSPACE, 'memory');
if (fs.existsSync(memDir)) {
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    const impDir = path.join(memDir, 'improvements');
    const impFiles = fs.existsSync(impDir) 
        ? fs.readdirSync(impDir).filter(f => f.endsWith('.md')) 
        : [];
    
    console.log(`  Arquivos memória: ${files.length}`);
    console.log(`  Melhorias: ${impFiles.length}`);
}

// Verificar sessões (se tool disponível)
console.log('\n💓 Sessões:');
console.log('  Status: Verificar via openclaw status');

// Quick stats
console.log('\n⚡ Quick Stats:');
const scriptsDir = path.join(WORKSPACE, 'scripts');
if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') || f.endsWith('.ps1'));
    console.log(`  Scripts: ${scripts.length}`);
}

const skillsDir = path.join(WORKSPACE, 'skills');
if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
    console.log(`  Skills: ${skills.length}`);
}

console.log('\n✅ Health check completo');
