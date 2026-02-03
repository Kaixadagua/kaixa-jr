#!/usr/bin/env node
// context-compactor.js - Análise e sugestões de compactação de contexto
// Última atualização: 2026-02-02

const fs = require('fs');
const path = require('path');

const TRANSCRIPTS_DIR = path.join(process.env.LOCALAPPDATA || process.env.HOME, 'openclaw', 'transcripts');

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function analyzeTranscripts() {
    try {
        const files = fs.readdirSync(TRANSCRIPTS_DIR)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => {
                const stats = fs.statSync(path.join(TRANSCRIPTS_DIR, f));
                return { name: f, size: stats.size, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime);
        
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        return { files, totalSize, count: files.length };
    } catch {
        return { files: [], totalSize: 0, count: 0 };
    }
}

function estimateTokens(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Estimativa aproximada: 1 token ~ 4 caracteres
        return Math.round(content.length / 4);
    } catch {
        return 0;
    }
}

function main() {
    console.log('\n🦊 Context Compactor\n');
    
    const { files, totalSize, count } = analyzeTranscripts();
    
    if (count === 0) {
        console.log('📂 Nenhum transcript encontrado');
        return;
    }
    
    // Header
    console.log('─'.repeat(50));
    console.log(`📊 Transcripts: ${count} arquivos`);
    console.log(`💾 Total: ${formatBytes(totalSize)}`);
    console.log('─'.repeat(50));
    
    // Top 5 maiores
    console.log('\n📁 Maiores arquivos:');
    files.slice(0, 5).forEach((f, i) => {
        const tokens = estimateTokens(path.join(TRANSCRIPTS_DIR, f.name));
        const warning = tokens > 200000 ? ' ⚠️' : '';
        console.log(`  ${i + 1}. ${f.name.substring(0, 20)}... │ ${formatBytes(f.size)} │ ~${(tokens/1000).toFixed(0)}k tokens${warning}`);
    });
    
    // Recomendações
    console.log('\n💡 Recomendações:');
    const largeFiles = files.filter(f => {
        const tokens = estimateTokens(path.join(TRANSCRIPTS_DIR, f.name));
        return tokens > 200000;
    });
    
    if (largeFiles.length > 0) {
        console.log(`  ⚠️ ${largeFiles.length} arquivo(s) > 200k tokens`);
        console.log('  📝 Considere flush de contexto para sessões antigas');
    } else {
        console.log('  ✅ Contexto saudável');
    }
    
    console.log('\n─'.repeat(50));
    console.log();
}

main();
