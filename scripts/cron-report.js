#!/usr/bin/env node
/**
 * @fileoverview Cron Report - Relatório elegante de melhoria contínua
 * @description Gera relatório formatado das execuções do cron de melhoria
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/cron-report.js [--json|-j] [--compact|-c]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração
const CONFIG = {
    improvementsDir: 'memory/improvements',
    reportDir: 'scripts/reports',
    outputJson: process.argv.includes('--json') || process.argv.includes('-j'),
    compactMode: process.argv.includes('--compact') || process.argv.includes('-c')
};

/**
 * Logger estilo Kaixa Jr
 */
const logger = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    warn: (msg) => console.log(`⚠️  ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    fox: () => console.log('🦊'),
    section: (title) => console.log(`\n━━━ ${title} ━━━`),
    metric: (label, value) => console.log(`  ${label.padEnd(20)} ${value}`),
    divider: () => console.log('─'.repeat(50))
};

/**
 * Lista arquivos de melhorias ordenados por data
 */
function getImprovements() {
    try {
        const dir = path.join(process.cwd(), CONFIG.improvementsDir);
        if (!fs.existsSync(dir)) return [];
        
        return fs.readdirSync(dir)
            .filter(f => f.endsWith('.md'))
            .map(f => {
                const stat = fs.statSync(path.join(dir, f));
                return {
                    filename: f,
                    created: stat.birthtime,
                    modified: stat.mtime,
                    size: stat.size
                };
            })
            .sort((a, b) => b.created - a.created);
    } catch {
        return [];
    }
}

/**
 * Obtém contagem de PRs abertos (backpressure)
 */
function getBackpressure() {
    try {
        const output = execSync('gh pr list --repo aura-io-saas/aurahub --state open --json number', { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        const prs = JSON.parse(output);
        return {
            count: prs.length,
            status: prs.length >= 9 ? '🔴 RED' : prs.length >= 6 ? '🟡 YELLOW' : '🟢 GREEN'
        };
    } catch {
        return { count: -1, status: '⚪ UNKNOWN' };
    }
}

/**
 * Calcula estatísticas das melhorias
 */
function calculateStats(improvements) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    return {
        total: improvements.length,
        today: improvements.filter(i => i.created >= today).length,
        lastHour: improvements.filter(i => i.created >= oneHourAgo).length,
        last24h: improvements.filter(i => i.created >= oneDayAgo).length,
        newest: improvements[0] || null,
        oldest: improvements[improvements.length - 1] || null
    };
}

/**
 * Formata tempo relativo
 */
function timeAgo(date) {
    const ms = Date.now() - date.getTime();
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
}

/**
 * Modo compacto: uma linha
 */
function reportCompact(stats, backpressure) {
    console.log(`🦊 ${stats.today} hoje | ${stats.total} total | ${backpressure.status}`);
}

/**
 * Modo JSON: saída estruturada
 */
function reportJson(stats, backpressure) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        improvements: {
            total: stats.total,
            today: stats.today,
            lastHour: stats.lastHour,
            last24h: stats.last24h,
            newest: stats.newest ? {
                filename: stats.newest.filename,
                created: stats.newest.created.toISOString()
            } : null
        },
        backpressure: backpressure
    }, null, 2));
}

/**
 * Relatório completo elegante
 */
function reportFull(stats, backpressure) {
    const now = new Date();
    
    // Header
    logger.section(`🦊 Kaixa Jr - Melhoria Contínua`);
    logger.metric('Report gerado', now.toLocaleString('pt-BR'));
    
    // Estatísticas
    logger.section('📊 Estatísticas');
    logger.metric('Total de melhorias', stats.total);
    logger.metric('Hoje', `🟢 ${stats.today}`);
    logger.metric('Última hora', `🔵 ${stats.lastHour}`);
    logger.metric('Últimas 24h', `🟡 ${stats.last24h}`);
    
    // Backpressure
    logger.section('🔄 Backpressure');
    logger.metric('PRs abertos', backpressure.count >= 0 ? backpressure.count : 'N/A');
    logger.metric('Status', backpressure.status);
    
    if (backpressure.status.includes('🔴')) {
        logger.warn('Backpressure ativo! Modo local recomendado.');
    }
    
    // Melhoria mais recente
    if (stats.newest) {
        logger.section('📝 Melhoria mais recente');
        logger.metric('Arquivo', stats.newest.filename.slice(0, 45));
        logger.metric('Criado', `${stats.newest.created.toLocaleString('pt-BR')} (${timeAgo(stats.newest.created)})`);
        logger.metric('Tamanho', `${(stats.newest.size / 1024).toFixed(1)} KB`);
    }
    
    // Footer
    logger.divider();
    console.log('🦊 Kaixa Jr - Progressão Contínua\n');
}

/**
 * Main
 */
function main() {
    const improvements = getImprovements();
    const stats = calculateStats(improvements);
    const backpressure = getBackpressure();
    
    if (CONFIG.outputJson) {
        reportJson(stats, backpressure);
    } else if (CONFIG.compactMode) {
        reportCompact(stats, backpressure);
    } else {
        reportFull(stats, backpressure);
    }
    
    return 0;
}

process.exit(main());
