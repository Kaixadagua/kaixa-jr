#!/usr/bin/env node
/**
 * @fileoverview Improvement Dashboard CLI - Visualização rápida de métricas
 * @description Mostra estatísticas visuais do sistema de melhorias Kaixa Jr
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/improvement-dashboard.js [--compact|-c]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMPROVEMENTS_DIR = path.join(process.cwd(), 'memory', 'improvements');
const METRICS_FILE = path.join(IMPROVEMENTS_DIR, 'metrics.json');

// Cores ANSI para terminal
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    fox: '\x1b[38;5;208m',    // Laranja fox
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

/**
 * Formata número com separador de milhares
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Cria barra de progresso visual
 */
function progressBar(value, max, width = 20) {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = Math.round((value / max) * 100);
    return `${bar} ${percentage}%`;
}

/**
 * Obtém lista de arquivos de melhoria
 */
function getImprovementFiles() {
    try {
        return fs.readdirSync(IMPROVEMENTS_DIR)
            .filter(f => f.endsWith('.md') && f !== 'INDEX.md' && !f.startsWith('CONSOLIDADO') && !f.startsWith('RESUMO') && !f.startsWith('TODO'))
            .map(f => ({
                name: f,
                path: path.join(IMPROVEMENTS_DIR, f),
                stats: fs.statSync(path.join(IMPROVEMENTS_DIR, f))
            }));
    } catch {
        return [];
    }
}

/**
 * Analisa melhorias por dia
 */
function getDailyStats(files) {
    const byDay = {};
    files.forEach(f => {
        const date = f.stats.mtime.toISOString().split('T')[0];
        byDay[date] = (byDay[date] || 0) + 1;
    });
    return byDay;
}

/**
 * Verifica backpressure atual
 */
function getBackpressureStatus() {
    try {
        const output = execSync('gh pr list --repo aura-io-saas/aurahub --state open --json number', { encoding: 'utf8' });
        const prs = JSON.parse(output);
        const count = prs.length;
        let status = 'green';
        let color = COLORS.green;
        if (count >= 9) {
            status = 'red';
            color = COLORS.red;
        } else if (count >= 6) {
            status = 'yellow';
            color = COLORS.yellow;
        }
        return { count, status, color };
    } catch {
        return { count: 0, status: 'unknown', color: COLORS.dim };
    }
}

/**
 * Carrega métricas persistentes
 */
function loadMetrics() {
    try {
        return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    } catch {
        return { cycles: [], lastUpdate: null };
    }
}

/**
 * Renderiza dashboard
 */
function renderDashboard(compact = false) {
    const files = getImprovementFiles();
    const dailyStats = getDailyStats(files);
    const backpressure = getBackpressureStatus();
    const metrics = loadMetrics();
    
    // Header
    console.log(`\n${COLORS.fox}${COLORS.bright}🦊 Kaixa Jr Improvement Dashboard${COLORS.reset}`);
    console.log(`${COLORS.dim}${'─'.repeat(50)}${COLORS.reset}\n`);
    
    // Stats principais
    const total = files.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = dailyStats[today] || 0;
    
    console.log(`${COLORS.bright}📊 Estatísticas Principais${COLORS.reset}`);
    console.log(`   Total de Melhorias: ${COLORS.cyan}${formatNumber(total)}${COLORS.reset}`);
    console.log(`   Hoje: ${COLORS.cyan}${todayCount}${COLORS.reset} melhoria(s)`);
    
    // Melhores dias
    const sortedDays = Object.entries(dailyStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (sortedDays.length > 0) {
        console.log(`\n${COLORS.bright}🏆 Top Dias${COLORS.reset}`);
        const maxDay = sortedDays[0][1];
        sortedDays.forEach(([date, count]) => {
            const bar = progressBar(count, maxDay, 15);
            console.log(`   ${date}: ${COLORS.cyan}${count}${COLORS.reset} ${bar}`);
        });
    }
    
    // Backpressure
    console.log(`\n${COLORS.bright}🔄 Backpressure${COLORS.reset}`);
    const bpEmoji = backpressure.status === 'green' ? '🟢' : backpressure.status === 'yellow' ? '🟡' : '🔴';
    console.log(`   ${bpEmoji} ${backpressure.color}${backpressure.count} PRs abertos${COLORS.reset}`);
    console.log(`   ${progressBar(backpressure.count, 15)}`);
    
    // Métricas de performance
    if (metrics.cycles && metrics.cycles.length > 0) {
        const recent = metrics.cycles.slice(-10);
        const avgTime = recent.reduce((a, b) => a + (b.duration || 0), 0) / recent.length;
        const avgImprovements = recent.reduce((a, b) => a + (b.improvements || 0), 0) / recent.length;
        
        console.log(`\n${COLORS.bright}⚡ Performance (últimos 10 ciclos)${COLORS.reset}`);
        console.log(`   Tempo médio: ${COLORS.magenta}${(avgTime / 60000).toFixed(1)}m${COLORS.reset}`);
        console.log(`   Melhorias/ciclo: ${COLORS.magenta}${avgImprovements.toFixed(1)}${COLORS.reset}`);
    }
    
    // Últimas melhorias
    if (!compact) {
        const recentFiles = files
            .sort((a, b) => b.stats.mtime - a.stats.mtime)
            .slice(0, 5);
        
        console.log(`\n${COLORS.bright}📝 Últimas Melhorias${COLORS.reset}`);
        recentFiles.forEach(f => {
            const time = f.stats.mtime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const name = f.name.replace('.md', '').substring(0, 35);
            console.log(`   ${COLORS.dim}${time}${COLORS.reset} ${name}`);
        });
    }
    
    // Footer
    console.log(`\n${COLORS.dim}${'─'.repeat(50)}${COLORS.reset}`);
    console.log(`${COLORS.dim}Última atualização: ${new Date().toLocaleString('pt-BR')}${COLORS.reset}\n`);
}

// Main
const compact = process.argv.includes('--compact') || process.argv.includes('-c');
renderDashboard(compact);
