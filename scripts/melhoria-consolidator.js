#!/usr/bin/env node
// melhoria-consolidator.js - Consolida registros de melhorias para batch PR
// Última atualização: 2026-02-02

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');
const OUTPUT_FILE = path.join(IMPROVEMENTS_DIR, 'CONSOLIDADO-BATCH.md');

function getImprovementFiles() {
    try {
        return fs.readdirSync(IMPROVEMENTS_DIR)
            .filter(f => f.match(/^\d{4}-\d{2}-\d{2}-\d{4}-.*\.md$/))
            .map(f => {
                const filePath = path.join(IMPROVEMENTS_DIR, f);
                const content = fs.readFileSync(filePath, 'utf8');
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    content,
                    stats,
                    date: f.substring(0, 10),
                    time: f.substring(11, 15),
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

function generateConsolidatedReport(files) {
    const today = new Date().toISOString().split('T')[0];
    const todayFiles = files.filter(f => f.stats.mtime.toISOString().startsWith(today));
    
    // Agrupar por categoria
    const byCategory = {};
    files.forEach(f => {
        const cat = f.categoria;
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(f);
    });
    
    let report = `# 📦 Consolidação de Melhorias - Batch PR\n\n`;
    report += `**Gerado:** ${today} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    report += `**Total:** ${files.length} melhorias\n`;
    report += `**Período:** ${files[files.length-1]?.date} a ${files[0]?.date}\n\n`;
    
    report += `## 🎯 Resumo por Categoria\n\n`;
    Object.entries(byCategory)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([cat, items]) => {
            report += `- **${cat}:** ${items.length} melhoria(s)\n`;
        });
    
    report += `\n## 📋 Lista Detalhada\n\n`;
    report += `| Horário | Categoria | Arquivo | Tipo |\n`;
    report += `|---------|-----------|---------|------|\n`;
    
    files.forEach(f => {
        const tipo = f.tipo.includes('local') ? '📍 Local' : '🚀 PR';
        const time = `${f.time.substring(0,2)}:${f.time.substring(2,4)}`;
        report += `| ${time} | ${f.categoria.split(' ')[1]} | \`${f.name}\` | ${tipo} |\n`;
    });
    
    report += `\n## 📁 Arquivos Afetados\n\n`;
    const allFiles = new Set();
    files.forEach(f => {
        const matches = f.content.match(/## Arquivos[\s\S]*?(?=##|$)/);
        if (matches) {
            const lines = matches[0].split('\\n');
            lines.forEach(line => {
                const fileMatch = line.match(/`([^`]+\.(js|ps1|bat|md|json))`/);
                if (fileMatch) allFiles.add(fileMatch[1]);
            });
        }
    });
    
    Array.from(allFiles).sort().forEach(file => {
        report += `- \`${file}\`\n`;
    });
    
    report += `\n## 🚀 Preparação para PR\n\n`;
    report += `Quando o backpressure for liberado:\n\n`;
    report += `1. Criar branch: \`batch/melhorias-${today}\`\n`;
    report += `2. Commit de todos os arquivos modificados\n`;
    report += `3. Push para origin\n`;
    report += `4. Criar PR com este consolidado\n\n`;
    
    report += `---\n\n`;
    report += `*Gerado automaticamente por melhoria-consolidator.js 🦊*\n`;
    
    return report;
}

function main() {
    console.log('🦊 Melhoria Consolidator\n');
    
    const files = getImprovementFiles();
    
    if (files.length === 0) {
        console.log('⚠️ Nenhuma melhoria encontrada');
        return;
    }
    
    console.log(`📊 Encontradas: ${files.length} melhorias`);
    
    const report = generateConsolidatedReport(files);
    fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
    
    console.log(`✅ Consolidado: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
    console.log(`📁 Total de arquivos: ${files.length}`);
    console.log(`\n🚀 Pronto para batch PR quando backpressure liberar!`);
}

main();
