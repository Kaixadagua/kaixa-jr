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
const REPO = 'Kaixadagua/kaixa-jr';

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
try {
    const statusOutput = execSync('openclaw status --json', { encoding: 'utf8', cwd: WORKSPACE });
    const status = JSON.parse(statusOutput);
    
    const activeSessions = status.sessions?.filter(s => s.status === 'active') || [];
    const cronSessions = activeSessions.filter(s => s.id?.includes('cron:'));
    const userSessions = activeSessions.filter(s => !s.id?.includes('cron:') && !s.id?.includes('system:'));
    
    logger.metric('Sessões ativas', activeSessions.length);
    logger.metric('Cron jobs', cronSessions.length);
    logger.metric('Sessões usuário', userSessions.length);
    
    // Alerta se sessões estão rodando há muito tempo
    const now = Date.now();
    const longRunning = activeSessions.filter(s => {
        const startTime = s.startedAt ? new Date(s.startedAt).getTime() : 0;
        return startTime && (now - startTime) > 30 * 60 * 1000; // >30min
    });
    
    if (longRunning.length > 0) {
        logger.warn(`${longRunning.length} sessão(ões) rodando há >30min`, 'Pode ser normal para tarefas longas');
    }
} catch (err) {
    logger.info('Verificar status via: openclaw status');
}

// Verificar cron jobs
logger.section('⏰ Cron Jobs');
try {
    const cronOutput = execSync('openclaw cron list', { encoding: 'utf8', cwd: WORKSPACE });
    const cronLines = cronOutput.trim().split('\n').filter(l => l.includes('|'));
    const activeCrons = cronLines.filter(l => !l.toLowerCase().includes('disabled'));
    
    logger.metric('Jobs configurados', cronLines.length - 1); // -1 for header
    logger.metric('Jobs ativos', activeCrons.length - 1);
} catch (err) {
    logger.info('Não foi possível verificar cron jobs');
}

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
