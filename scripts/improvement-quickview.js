#!/usr/bin/env node
/**
 * @fileoverview QuickView de Melhorias - Visualizador rápido das últimas melhorias
 * 
 * Mostra as N melhorias mais recentes em formato compacto para acompanhamento rápido.
 * Útil durante heartbeats e check-ins manuais.
 * 
 * @example
 * node scripts/improvement-quickview.js          # Últimas 5 melhorias
 * node scripts/improvement-quickview.js -n 10    # Últimas 10 melhorias
 * node scripts/improvement-quickview.js --json   # Saída estruturada
 * 
 * @author Kaixa Jr 🦊
 * @since 2026-02-08
 */

const fs = require('fs');
const path = require('path');

// Config
const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');
const DEFAULT_COUNT = 5;

/**
 * Extrai título do conteúdo markdown
 * @param {string} content - Conteúdo do arquivo
 * @returns {string} Título extraído ou 'Sem título'
 */
function extractTitle(content) {
  const lines = content.split('\n');
  
  // Procura por # Título
  for (const line of lines) {
    const match = line.match(/^#+\s*(.+)$/);
    if (match) return match[1].trim();
  }
  
  // Procura por **Branch:** ou arquivo
  const branchMatch = content.match(/\*\*Branch:\*\*\s*`?([^`\n]+)`?/);
  if (branchMatch) return branchMatch[1].trim();
  
  const fileMatch = content.match(/\*\*Arquivo:\*\*\s*`?([^`\n]+)`?/);
  if (fileMatch) return fileMatch[1].trim();
  
  return 'Sem título';
}

/**
 * Extrai tipo de melhoria do conteúdo
 * @param {string} content - Conteúdo do arquivo
 * @returns {string} Tipo detectado
 */
function detectType(content) {
  const upper = content.toUpperCase();
  if (upper.includes('LOCAL')) return 'local';
  if (upper.includes('PR #')) return 'pr';
  if (upper.includes('REFACTOR')) return 'refactor';
  if (upper.includes('DOC')) return 'docs';
  if (upper.includes('SCRIPT') || upper.includes('.JS')) return 'code';
  return 'other';
}

/**
 * Extrai número da melhoria do conteúdo ou nome do arquivo
 * @param {string} content - Conteúdo
 * @param {string} filename - Nome do arquivo
 * @returns {string} Número da melhoria
 */
function extractNumber(content, filename) {
  const match = content.match(/Melhoria\s*#?(\d+)/i);
  if (match) return match[1];
  
  // Extrai do nome do arquivo (timestamp)
  const tsMatch = filename.match(/\d{4}-\d{2}-\d{2}[T-]\d{2}/);
  if (tsMatch) {
    return tsMatch[0].replace(/[T-]/g, '').slice(0, 10);
  }
  
  return '?';
}

/**
 * Formata data de timestamp do nome do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {string} Data formatada
 */
function formatDate(filename) {
  const match = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '?';
  
  const [, year, month, day] = match;
  return `${day}/${month}`;
}

/**
 * Carrega e parseia arquivos de melhorias
 * @returns {Array<{filename: string, content: string, stats: object}>}
 */
function loadImprovements() {
  if (!fs.existsSync(IMPROVEMENTS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(IMPROVEMENTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'TRACKING.md')
    .map(f => {
      const filepath = path.join(IMPROVEMENTS_DIR, f);
      const stats = fs.statSync(filepath);
      const content = fs.readFileSync(filepath, 'utf-8');
      return { filename: f, content, stats, mtime: stats.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
  
  return files;
}

/**
 * Renderiza visualização em formato texto
 * @param {Array} improvements - Lista de melhorias
 * @param {number} count - Quantidade a mostrar
 */
function renderText(improvements, count) {
  const recent = improvements.slice(0, count);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     📊 QUICKVIEW DE MELHORIAS - Kaixa Jr 🦊              ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  
  recent.forEach((imp, i) => {
    const title = extractTitle(imp.content);
    const type = detectType(imp.content);
    const num = extractNumber(imp.content, imp.filename);
    const date = formatDate(imp.filename);
    
    const typeEmoji = {
      'local': '📝',
      'pr': '🔗',
      'refactor': '♻️',
      'docs': '📄',
      'code': '💻',
      'other': '📦'
    }[type] || '📦';
    
    const line1 = `${typeEmoji} #${num} [${date}]`.padEnd(15);
    const line2 = title.length > 35 ? title.slice(0, 32) + '...' : title;
    
    console.log(`║  ${line1} ${line2.padEnd(38)} ║`);
  });
  
  // Total
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  📈 Total: ${improvements.length.toString().padEnd(45)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
}

/**
 * Renderiza saída JSON
 * @param {Array} improvements - Lista de melhorias
 * @param {number} count - Quantidade a mostrar
 */
function renderJSON(improvements, count) {
  const recent = improvements.slice(0, count).map(imp => ({
    filename: imp.filename,
    title: extractTitle(imp.content),
    type: detectType(imp.content),
    number: extractNumber(imp.content, imp.filename),
    date: formatDate(imp.filename),
    size: imp.stats.size
  }));
  
  console.log(JSON.stringify({
    total: improvements.length,
    showing: recent.length,
    improvements: recent
  }, null, 2));
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json') || args.includes('-j');
  const countIndex = args.findIndex(a => a === '-n' || a === '--count');
  const count = countIndex >= 0 ? parseInt(args[countIndex + 1], 10) || DEFAULT_COUNT : DEFAULT_COUNT;
  
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node improvement-quickview.js [opções]

Opções:
  -n, --count <n>   Mostrar últimas n melhorias (padrão: 5)
  -j, --json        Saída em formato JSON
  -h, --help        Mostrar ajuda

Exemplos:
  node improvement-quickview.js           # Últimas 5
  node improvement-quickview.js -n 10     # Últimas 10
  node improvement-quickview.js --json    # JSON estruturado
    `);
    process.exit(0);
  }
  
  const improvements = loadImprovements();
  
  if (improvements.length === 0) {
    console.error('❌ Nenhuma melhoria encontrada em memory/improvements/');
    process.exit(1);
  }
  
  if (jsonMode) {
    renderJSON(improvements, count);
  } else {
    renderText(improvements, count);
  }
}

main();
