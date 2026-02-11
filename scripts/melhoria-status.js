#!/usr/bin/env node
/**
 * @fileoverview Kaixa Jr - Dashboard de Melhorias
 * @description Exibe métricas e estatísticas do sistema de melhoria contínua
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/melhoria-status.js [--json|-j]
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = 'memory/improvements';

/**
 * Extrai data do timestamp ISO
 * @param {string} timestamp - Timestamp no formato 2026-02-09T02-20-12
 * @returns {string} Data formatada
 */
function parseTimestamp(timestamp) {
    const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
    if (!match) return timestamp;
    
    const [, year, month, day, hour, min] = match;
    return `${day}/${month}/${year} ${hour}:${min}`;
}

/**
 * Obtém data apenas (para agrupamento)
 * @param {string} timestamp - Timestamp ISO
 * @returns {string} Data YYYY-MM-DD
 */
function getDateKey(timestamp) {
    const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : timestamp;
}

/**
 * Analisa conteúdo de arquivo de melhoria
 * @param {string} content - Conteúdo markdown
 * @returns {Object} Dados estruturados
 */
function parseImprovement(content) {
    const data = {
        type: 'unknown',
        category: 'unknown',
        description: '',
        hasBranch: false,
        hasPR: false,
        status: 'unknown'
    };
    
    // Extrai categoria
    const catMatch = content.match(/## Categoria\s*\n([^\n]+)/);
    if (catMatch) data.category = catMatch[1].trim();
    
    // Extrai descrição
    const descMatch = content.match(/## Descrição\s*\n([^\n]+)/);
    if (descMatch) data.description = descMatch[1].trim();
    
    // Verifica status
    if (content.includes('✅ Implementada localmente')) {
        data.status = 'local';
    }
    if (content.includes('✅ Mergeado')) {
        data.status = 'merged';
    }
    
    // Verifica branch/PR
    data.hasBranch = content.includes('## Branch');
    data.hasPR = content.includes('## PR') || content.includes('github.com');
    
    return data;
}

/**
 * Carrega todas as melhorias do diretório
 * @returns {Array} Lista de melhorias
 */
function loadImprovements() {
    const dir = path.join(process.cwd(), IMPROVEMENTS_DIR);
    
    if (!fs.existsSync(dir)) {
        return [];
    }
    
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('-melhoria.md'))
        .sort()
        .reverse();
    
    return files.map(filename => {
        const filepath = path.join(dir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const timestamp = filename.replace('-melhoria.md', '');
        const data = parseImprovement(content);
        
        return {
            filename,
            timestamp,
            dateFormatted: parseTimestamp(timestamp),
            dateKey: getDateKey(timestamp),
            ...data
        };
    });
}

/**
 * Calcula estatísticas agregadas
 * @param {Array} improvements - Lista de melhorias
 * @returns {Object} Estatísticas
 */
function calculateStats(improvements) {
    const stats = {
        total: improvements.length,
        byCategory: {},
        byStatus: {},
        byDate: {},
        withBranch: 0,
        withPR: 0,
        localOnly: 0
    };
    
    improvements.forEach(imp => {
        // Por categoria
        const cat = imp.category.replace(/[📝🧪🔧⚙️💻🚀]\s*/, '').trim() || 'Unknown';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        
        // Por status
        stats.byStatus[imp.status] = (stats.byStatus[imp.status] || 0) + 1;
        
        // Por data
        stats.byDate[imp.dateKey] = (stats.byDate[imp.dateKey] || 0) + 1;
        
        // Flags
        if (imp.hasBranch) stats.withBranch++;
        if (imp.hasPR) stats.withPR++;
        if (imp.status === 'local') stats.localOnly++;
    });
    
    return stats;
}

/**
 * Exibe dashboard no console
 * @param {Array} improvements - Lista de melhorias
 * @param {Object} stats - Estatísticas
 */
function displayDashboard(improvements, stats) {
    console.log('\n🦊 Kaixa Jr - Dashboard de Melhorias\n');
    console.log('═'.repeat(60));
    
    // Resumo
    console.log('\n📊 Resumo');
    console.log('─'.repeat(40));
    console.log(`   Total de melhorias: ${stats.total}`);
    console.log(`   Com branch/PR: ${stats.withBranch} | Somente local: ${stats.localOnly}`);
    
    // Por categoria
    console.log('\n📁 Por Categoria');
    console.log('─'.repeat(40));
    const cats = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    cats.forEach(([cat, count]) => {
        const bar = '█'.repeat(Math.min(count, 20));
        console.log(`   ${cat.padEnd(15)} ${bar} ${count}`);
    });
    
    // Por data (últimos 7 dias)
    console.log('\n📈 Por Data (últimos 7 dias)');
    console.log('─'.repeat(40));
    const dates = Object.entries(stats.byDate)
        .sort()
        .slice(-7);
    dates.forEach(([date, count]) => {
        const bar = '█'.repeat(Math.min(count, 15));
        console.log(`   ${date} ${bar} ${count}`);
    });
    
    // Últimas melhorias
    console.log('\n🕐 Últimas 5 Melhorias');
    console.log('─'.repeat(40));
    improvements.slice(0, 5).forEach(imp => {
        const icon = imp.status === 'local' ? '📍' : imp.hasPR ? '🔀' : '✅';
        const shortDesc = imp.description.length > 35 
            ? imp.description.slice(0, 35) + '...'
            : imp.description;
        console.log(`   ${icon} ${imp.dateFormatted.split(' ')[0]} - ${shortDesc}`);
    });
    
    // Taxa de melhoria
    if (dates.length > 1) {
        const avgPerDay = (stats.total / Object.keys(stats.byDate).length).toFixed(1);
        console.log('\n⚡ Taxa Média');
        console.log('─'.repeat(40));
        console.log(`   ${avgPerDay} melhorias/dia`);
        
        // Últimas 24h
        const today = new Date().toISOString().slice(0, 10);
        const todayCount = stats.byDate[today] || 0;
        console.log(`   Hoje: ${todayCount} melhorias`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log();
}

/**
 * Executa análise principal
 */
function main() {
    const args = process.argv.slice(2);
    const jsonMode = args.includes('--json') || args.includes('-j');
    
    const improvements = loadImprovements();
    
    if (improvements.length === 0) {
        if (jsonMode) {
            console.log(JSON.stringify({ error: 'Nenhuma melhoria encontrada' }, null, 2));
        } else {
            console.log('\n🦊 Nenhuma melhoria encontrada ainda.\n');
        }
        process.exit(0);
    }
    
    const stats = calculateStats(improvements);
    
    if (jsonMode) {
        console.log(JSON.stringify({ stats, improvements: improvements.slice(0, 10) }, null, 2));
    } else {
        displayDashboard(improvements, stats);
    }
}

main();
