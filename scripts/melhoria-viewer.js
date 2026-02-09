#!/usr/bin/env node
/**
 * @fileoverview Melhoria Viewer - Visualização interativa das melhorias
 * @description Lista, filtra e resume melhorias do sistema com estatísticas
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/melhoria-viewer.js [categoria] [--stats|-s]
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = 'memory/improvements';
const TRACKING_FILE = 'memory/improvements/TRACKING.md';

/**
 * Extrai metadata de uma melhoria
 * @param {string} content - Conteúdo do arquivo
 * @returns {Object} Metadata extraído
 */
function parseMetadata(content) {
    const lines = content.split('\n');
    const metadata = {
        type: 'unknown',
        scope: 'general',
        description: '',
        date: null
    };
    
    for (const line of lines.slice(0, 10)) {
        if (line.startsWith('**Tipo:**')) {
            metadata.type = line.split(':')[1]?.trim().toLowerCase() || 'unknown';
        } else if (line.startsWith('**Escopo:**')) {
            metadata.scope = line.split(':')[1]?.trim().toLowerCase() || 'general';
        } else if (line.startsWith('**Descrição:**')) {
            metadata.description = line.split(':')[1]?.trim() || '';
        } else if (line.startsWith('**Quando:**')) {
            metadata.date = line.split(':')[1]?.trim() || null;
        }
    }
    
    return metadata;
}

/**
 * Carrega todas as melhorias do diretório
 * @returns {Object[]} Array de melhorias com metadata
 */
function loadImprovements() {
    const dir = path.join(process.cwd(), IMPROVEMENTS_DIR);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && f !== 'TRACKING.md' && f !== 'README.md')
        .sort((a, b) => {
            // Ordenar por data (mais recente primeiro)
            const dateA = a.match(/(\d{4}-\d{2}-\d{2})/)?.[0] || '';
            const dateB = b.match(/(\d{4}-\d{2}-\d{2})/)?.[0] || '';
            return dateB.localeCompare(dateA);
        });
    
    return files.map(file => {
        const filepath = path.join(dir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        const metadata = parseMetadata(content);
        
        return {
            file,
            ...metadata,
            wordCount: content.split(/\s+/).length
        };
    });
}

/**
 * Calcula estatísticas das melhorias
 * @param {Object[]} improvements - Array de melhorias
 * @returns {Object} Estatísticas calculadas
 */
function calculateStats(improvements) {
    const stats = {
        total: improvements.length,
        byType: {},
        byScope: {},
        byDate: {},
        totalWords: 0
    };
    
    improvements.forEach(imp => {
        // Por tipo
        stats.byType[imp.type] = (stats.byType[imp.type] || 0) + 1;
        // Por escopo
        stats.byScope[imp.scope] = (stats.byScope[imp.scope] || 0) + 1;
        // Por data
        if (imp.date) {
            stats.byDate[imp.date] = (stats.byDate[imp.date] || 0) + 1;
        }
        stats.totalWords += imp.wordCount;
    });
    
    return stats;
}

/**
 * Formata número com padding
 * @param {number} n - Número
 * @param {number} width - Largura
 * @returns {string} Número formatado
 */
function pad(n, width) {
    return n.toString().padStart(width, ' ');
}

/**
 * Exibe estatísticas formatadas
 * @param {Object} stats - Estatísticas
 */
function showStats(stats) {
    console.log('\n📊 Estatísticas de Melhorias\n');
    console.log('─'.repeat(50));
    
    console.log(`\nTotal: ${stats.total} melhorias`);
    console.log(`Palavras: ~${(stats.totalWords / 1000).toFixed(1)}k palavras`);
    
    console.log('\n📁 Por Tipo:');
    Object.entries(stats.byType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            const bar = '█'.repeat(Math.min(count, 20));
            console.log(`  ${type.padEnd(12)} ${pad(count, 3)} ${bar}`);
        });
    
    console.log('\n🎯 Por Escopo:');
    Object.entries(stats.byScope)
        .sort((a, b) => b[1] - a[1])
        .forEach(([scope, count]) => {
            console.log(`  ${scope.padEnd(15)} ${count}`);
        });
    
    // Últimas 7 dias
    const recentDates = Object.entries(stats.byDate)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7);
    
    if (recentDates.length > 0) {
        console.log('\n📅 Atividade Recente:');
        recentDates.forEach(([date, count]) => {
            console.log(`  ${date}: ${count} melhoria(s)`);
        });
    }
    
    console.log('─'.repeat(50));
}

/**
 * Lista melhorias com filtro opcional
 * @param {Object[]} improvements - Array de melhorias
 * @param {string} [filter] - Filtro por tipo/escopo
 * @param {number} [limit=20] - Limite de resultados
 */
function listImprovements(improvements, filter, limit = 20) {
    let filtered = improvements;
    
    if (filter) {
        const f = filter.toLowerCase();
        filtered = improvements.filter(i => 
            i.type.includes(f) || 
            i.scope.includes(f) ||
            i.file.toLowerCase().includes(f)
        );
    }
    
    console.log(`\n📝 Melhorias${filter ? ` (filtro: "${filter}")` : ''}\n`);
    console.log('─'.repeat(70));
    
    filtered.slice(0, limit).forEach((imp, idx) => {
        const icon = {
            refactor: '🔧', feature: '✨', fix: '🐛',
            docs: '📚', test: '🧪', perf: '⚡',
            config: '⚙️', unknown: '📝'
        }[imp.type] || '📝';
        
        const shortDesc = imp.description.length > 45 
            ? imp.description.slice(0, 42) + '...'
            : imp.description;
        
        console.log(`${pad(idx + 1, 3)} ${icon} ${imp.file.slice(0, 25).padEnd(25)} │ ${shortDesc || '(sem descrição)'}`);
    });
    
    if (filtered.length > limit) {
        console.log(`\n... e mais ${filtered.length - limit} melhorias`);
    }
    
    console.log('─'.repeat(70));
}

/**
 * Função principal
 */
function main() {
    const args = process.argv.slice(2);
    const showStatsOnly = args.includes('--stats') || args.includes('-s');
    const filter = args.find(a => !a.startsWith('-'));
    
    const improvements = loadImprovements();
    
    if (improvements.length === 0) {
        console.log('🦊 Nenhuma melhoria encontrada em', IMPROVEMENTS_DIR);
        return;
    }
    
    if (showStatsOnly) {
        showStats(calculateStats(improvements));
    } else {
        listImprovements(improvements, filter);
        
        // Sempre mostrar estatísticas resumidas
        const stats = calculateStats(improvements);
        console.log(`\n📊 Total: ${stats.total} | Tipos: ${Object.keys(stats.byType).length} | Escopos: ${Object.keys(stats.byScope).length}`);
        console.log('\n💡 Use --stats para ver estatísticas completas');
        console.log('💡 Passe um termo para filtrar (ex: "refactor", "docs")');
    }
    
    console.log();
}

main();
