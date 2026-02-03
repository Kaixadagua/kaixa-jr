#!/usr/bin/env node
// melhoria-status.js - Dashboard de melhorias contínuas
// Última atualização: 2026-02-02 - Categorização + Metadados

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');

function getImprovementFiles() {
    try {
        return fs.readdirSync(IMPROVEMENTS_DIR)
            .filter(f => f.endsWith('.md') && f !== 'TRACKING.md')
            .map(f => {
                const filePath = path.join(IMPROVEMENTS_DIR, f);
                const content = fs.readFileSync(filePath, 'utf8');
                return {
                    name: f,
                    path: filePath,
                    stats: fs.statSync(filePath),
                    content,
                    tipo: extractField(content, 'Tipo'),
                    categoria: extractCategoria(content)
                };
            })
            .sort((a, b) => b.stats.mtime - a.stats.mtime);
    } catch {
        return [];
    }
}

function extractField(content, field) {
    const match = content.match(new RegExp(`## ${field}\\s*\\n([^\\n]+)`));
    return match ? match[1].trim() : 'N/A';
}

function extractCategoria(content) {
    if (content.includes('código') || content.includes('Código')) return '💻 Código';
    if (content.includes('documentação') || content.includes('Documentação')) return '📝 Docs';
    if (content.includes('config') || content.includes('Config')) return '⚙️ Config';
    if (content.includes('skill') || content.includes('Skill')) return '🎓 Skill';
    if (content.includes('workflow') || content.includes('Workflow')) return '🔄 Workflow';
    if (content.includes('infra') || content.includes('Infra')) return '🏗️ Infra';
    return '📦 Outro';
}

function generateReport() {
    const files = getImprovementFiles();
    const today = new Date().toISOString().split('T')[0];
    const todayFiles = files.filter(f => f.stats.mtime.toISOString().startsWith(today));
    
    // Categorias
    const categorias = {};
    files.forEach(f => {
        categorias[f.categoria] = (categorias[f.categoria] || 0) + 1;
    });
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🦊 MELHORIAS CONTÍNUAS - DASHBOARD ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log(`📅 Data: ${today}`);
    console.log(`📊 Total: ${files.length} melhorias`);
    console.log(`⚡ Hoje: ${todayFiles.length}\n`);
    
    // Categorias
    console.log('📁 Por Categoria:');
    Object.entries(categorias)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            const bar = '█'.repeat(Math.min(count, 10));
            console.log(`  ${cat.padEnd(12)} ${bar} ${count}`);
        });
    
    // Melhorias de hoje
    if (todayFiles.length > 0) {
        console.log('\n🕐 Melhorias de hoje:');
        todayFiles.slice(0, 5).forEach(f => {
            const time = f.stats.mtime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const tipo = f.tipo.includes('local') ? '📍' : '🚀';
            console.log(`  ${tipo} [${time}] ${f.categoria.split(' ')[1]}: ${path.basename(f.name, '.md')}`);
        });
    }
    
    // Recentes (últimas 3)
    console.log('\n🔄 Recentes:');
    files.slice(0, 3).forEach(f => {
        const time = f.stats.mtime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        console.log(`  [${time}] ${f.categoria.split(' ')[1]}`);
    });
    
    console.log('\n─────────────────────────');
    console.log('Cadência: 5min | 🔴 Backpressure: 12 PRs');
    console.log('─────────────────────────');
}

generateReport();
