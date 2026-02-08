#!/usr/bin/env node
/**
 * health-check.js - Verificação rápida de saúde do ambiente
 * 
 * Uso: node scripts/health-check.js
 * Última atualização: 2026-02-08 - Refatorado com logger centralizado
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./lib/logger');

const WORKSPACE = 'C:\\Users\\joaov\\.openclaw\\workspace';
const REPO = 'aura-io-saas/aurahub';

logger.section('🦊 Kaixa Jr - Health Check');

// Verificar git
logger.info('Verificando estado do git...');
try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: WORKSPACE }).trim();
    const status = execSync('git status --short', { encoding: 'utf8', cwd: WORKSPACE }).trim();
    const changesCount = status ? status.split('\n').length : 0;
    
    logger.metric('Branch', branch);
    logger.metric('Changes pendentes', changesCount || 'Limpo');
} catch (err) {
    logger.warn('Não é um repositório git ou git não disponível', err.message);
}

// Backpressure
logger.section('📊 Backpressure');
try {
    const prList = execSync(`gh pr list --repo ${REPO} --state open`, { encoding: 'utf8' }).trim();
    const prCount = prList ? prList.split('\n').length : 0;
    
    let status = '🟢';
    let level = 'success';
    if (prCount >= 9) {
        status = '🔴';
        level = 'error';
    } else if (prCount >= 6) {
        status = '🟡';
        level = 'warn';
    }
    
    logger.metric('PRs abertos', `${status} ${prCount}`);
    logger.result(prCount < 9, prCount >= 9 ? 'BACKPRESSURE ATIVO' : 'Fluxo normal');
} catch (err) {
    logger.warn('Não foi possível verificar PRs', err.message);
}

// Verificar memória
logger.section('🧠 Memória');
const memDir = path.join(WORKSPACE, 'memory');
if (fs.existsSync(memDir)) {
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    const impDir = path.join(memDir, 'improvements');
    const impFiles = fs.existsSync(impDir) 
        ? fs.readdirSync(impDir).filter(f => f.endsWith('.md')) 
        : [];
    
    logger.metric('Arquivos memória', files.length);
    logger.metric('Melhorias registradas', impFiles.length);
} else {
    logger.warn('Diretório de memória não encontrado');
}

// Verificar sessões
logger.section('💓 Sessões');
logger.info('Verificar status via: openclaw status');

// Quick stats
logger.section('⚡ Quick Stats');
const scriptsDir = path.join(WORKSPACE, 'scripts');
const libDir = path.join(scriptsDir, 'lib');
if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') || f.endsWith('.ps1'));
    logger.metric('Scripts', scripts.length);
}
if (fs.existsSync(libDir)) {
    const libs = fs.readdirSync(libDir).filter(f => f.endsWith('.js'));
    logger.metric('Bibliotecas', libs.length);
}

const skillsDir = path.join(WORKSPACE, 'skills');
if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
    logger.metric('Skills', skills.length);
}

logger.success('Health check completo');
