#!/usr/bin/env node
/**
 * @fileoverview Melhorias Dashboard - Visualização consolidada
 * @description Mostra estatísticas e métricas das melhorias realizadas
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = 'memory/improvements';

/**
 * Carrega todas as melhorias do diretório
 * @returns {Object[]} Array de melhorias parseadas
 */
function loadImprovements() {
    const dir = path.join(process.cwd(), IMPROVEMENTS_DIR);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && f.includes('melhoria'))
        .sort();
    
    return files.map(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const date = file.slice(0, 10);
        const time = file.slice(11, 15) || '0000';
        
        // Extrair tipo de melhoria
        const typeMatch = content.match(/\*\*Tipo:\*\*\s*(.+)/);
        const type = typeMatch ? typeMatch[1].trim() : 'unknown';
        
        // Extrair descrição
        const descMatch = content.match(/\*\*Descrição:\*\*\s*(.+)/);
        const description = descMatch ? descMatch[1].trim() : '';
        
        // Extrair status de backpressure
        const bpMatch = content.match(/\*\*Backpressure:\*\*\s*(.+)/);
        const backpressure = bpMatch ? bpMatch[1].trim() : 'unknown';
        
        return {
            file,
            date,
            time: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            type,
            description,
            backpressure
        };
    });
}

/**
 * Calcula estatísticas das melhorias
 * @param {Object[]} improvements - Array de melhorias
 * @returns {Object} Estatísticas calculadas
 */
function calculateStats(improvements) {
    const byDate = {};
    const byType = {};
    let withPR = 0;
    let withoutPR = 0;
    
    improvements.forEach(imp => {
        // Por data
        byDate[imp.date] = (byDate[imp.date] || 0) + 1;
        
        // Por tipo
        byType[imp.type] = (byType[imp.type] || 0) + 1;
        
        // Com/sem PR
        if (imp.backpressure.includes('PR') || imp.backpressure.includes('green') || imp.backpressure.includes('yellow')) {
            withPR++;
        } else {
            withoutPR++;
        }
    });
    
    return {
        total: improvements.length,
        byDate,
        byType,
        withPR,
        withoutPR,
        dates: Object.keys(byDate).length
    };
}

/**
 * Renderiza dashboard no console
 */
function renderDashboard() {
    const improvements = loadImprovements();
    const stats = calculateStats(improvements);
    
    console.log('\n🦊 Melhorias Dashboard\n');
    console.log('═'.repeat(50));
    
    // Resumo
    console.log(`\n📊 Resumo Geral`);
    console.log('─'.repeat(50));
    console.log(`   Total de melhorias: ${stats.total}`);
    console.log(`   Dias ativos: ${stats.dates}`);
    console.log(`   Com PR: ${stats.withPR} | Local: ${stats.withoutPR}`);
    
    // Por tipo
    console.log(`\n📁 Por Tipo`);
    console.log('─'.repeat(50));
    Object.entries(stats.byType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            const bar = '█'.repeat(Math.min(count, 20));
            console.log(`   ${type.padEnd(15)} ${bar} ${count}`);
        });
    
    // Por data (últimos 5 dias)
    console.log(`\n📅 Por Data (últimos dias)`);
    console.log('─'.repeat(50));
    Object.entries(stats.byDate)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5)
        .forEach(([date, count]) => {
            const bar = '█'.repeat(Math.min(count, 20));
            console.log(`   ${date} ${bar} ${count}`);
        });
    
    // Últimas melhorias
    console.log(`\n🕐 Últimas 5 Melhorias`);
    console.log('─'.repeat(50));
    improvements.slice(-5).forEach(imp => {
        const icon = imp.backpressure.includes('PR') ? '📤' : '📝';
        console.log(`   ${icon} [${imp.date} ${imp.time}] ${imp.type}`);
        console.log(`      ${imp.description.slice(0, 40)}${imp.description.length > 40 ? '...' : ''}`);
    });
    
    console.log('\n' + '═'.repeat(50));
    console.log();
}

renderDashboard();
