#!/usr/bin/env node
/**
 * Melhoria Consolidator
 * Consolida melhorias locais em batch para PR quando backpressure diminuir
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = './memory/improvements';
const CONSOLIDATED_FILE = './memory/improvements/CONSOLIDADO-BATCH.md';

function main() {
    console.log('🦊 Consolidando melhorias...\n');
    
    const files = fs.readdirSync(IMPROVEMENTS_DIR)
        .filter(f => f.endsWith('.md') && f !== 'CONSOLIDADO-BATCH.md' && f !== 'TRACKING.md')
        .sort();
    
    if (files.length === 0) {
        console.log('✅ Nenhuma melhoria para consolidar');
        return;
    }
    
    console.log(`📁 Encontradas: ${files.length} melhorias\n`);
    
    // Agrupar por categoria
    const byCategory = {};
    const byDate = {};
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(IMPROVEMENTS_DIR, file), 'utf-8');
        
        // Extrair categoria
        const catMatch = content.match(/Categoria:\s*(.+)/);
        const category = catMatch ? catMatch[1].trim() : 'Outros';
        
        // Extrair data do nome do arquivo
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : 'Unknown';
        
        if (!byCategory[category]) byCategory[category] = [];
        if (!byDate[date]) byDate[date] = [];
        
        byCategory[category].push({ file, content, date });
        byDate[date].push({ file, content, category });
    }
    
    // Gerar relatório consolidado
    let report = `# 📦 Consolidação de Melhorias (Batch)\n\n`;
    report += `**Total:** ${files.length} melhorias\n`;
    report += `**Gerado:** ${new Date().toISOString()}\n`;
    report += `**Status:** Aguardando backpressure diminuir para batch PR\n\n`;
    
    // Resumo por categoria
    report += `## 📊 Por Categoria\n\n`;
    for (const [cat, items] of Object.entries(byCategory).sort((a,b) => b[1].length - a[1].length)) {
        report += `- **${cat}:** ${items.length} melhorias\n`;
    }
    report += '\n';
    
    // Resumo por data
    report += `## 📅 Por Data\n\n`;
    for (const [date, items] of Object.entries(byDate).sort().reverse()) {
        report += `- **${date}:** ${items.length} melhorias\n`;
    }
    report += '\n';
    
    // Detalhes
    report += `## 📝 Detalhes\n\n`;
    for (const [date, items] of Object.entries(byDate).sort().reverse()) {
        report += `### ${date}\n\n`;
        for (const item of items) {
            const lines = item.content.split('\n');
            const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || item.file;
            report += `- [${item.category}] ${title.replace('Melhoria: ', '')}\n`;
        }
        report += '\n';
    }
    
    fs.writeFileSync(CONSOLIDATED_FILE, report);
    console.log(`✅ Consolidado em: ${CONSOLIDATED_FILE}`);
    console.log(`📊 Categorias: ${Object.keys(byCategory).length}`);
    console.log(`📅 Período: ${Object.keys(byDate).sort()[0]} a ${Object.keys(byDate).sort().pop()}`);
}

main();
