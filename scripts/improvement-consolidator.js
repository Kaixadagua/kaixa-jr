/**
 * 🦊 Kaixa Improvement Consolidator
 * 
 * Consolida melhorias locais pendentes em batch quando backpressure está ativo.
 * Facilita o processo de PR quando o backlog liberar.
 * 
 * Uso: node scripts/improvement-consolidator.js [--auto]
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(process.cwd(), 'memory', 'improvements');
const OUTPUT_DIR = path.join(process.cwd(), 'memory', 'improvements');

function getTimestamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function parseImprovementFile(content, filename) {
  const lines = content.split('\n');
  const improvement = {
    filename,
    tipo: 'Desconhecido',
    categoria: 'Geral',
    descricao: '',
    arquivoAlvo: '',
    acao: '',
    raw: content
  };

  for (const line of lines) {
    if (line.startsWith('## Tipo')) continue;
    if (line.startsWith('📝') || line.startsWith('🔧') || line.startsWith('🧪') || line.startsWith('📚')) {
      improvement.tipo = line.replace(/^[📝🔧🧪📚]\s*/, '').trim();
    }
    if (line.startsWith('## Categoria')) continue;
    if (line.match(/^[🎯🔒🧪📝📊🔄⚡🛡️🔧]/)) {
      improvement.categoria = line.replace(/^[🎯🔒🧪📝📊🔄⚡🛡️🔧]\s*/, '').trim();
    }
    if (line.startsWith('## Descrição')) continue;
    if (line.startsWith('## Arquivo')) {
      const match = line.match(/Arquivo Alvo[\s\S]*?\n([^#]+)/);
      if (match) improvement.arquivoAlvo = match[1].trim();
    }
    if (line.startsWith('## Ação')) continue;
    if (line.startsWith('add-') || line.startsWith('fix-') || line.startsWith('refactor-') || line.startsWith('docs-')) {
      improvement.acao = line.trim();
    }
    if (line.length > 10 && !line.startsWith('#') && !line.startsWith('---') && !improvement.descricao) {
      improvement.descricao = line.trim();
    }
  }

  return improvement;
}

function getCategoryEmoji(categoria) {
  const map = {
    'Test': '🧪',
    'Docs': '📚',
    'Config': '⚙️',
    'Refactor': '🔄',
    'Feature': '✨',
    'Fix': '🐛',
    'Security': '🔒',
    'Performance': '⚡'
  };
  return map[categoria] || '📝';
}

function loadImprovements() {
  if (!fs.existsSync(IMPROVEMENTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(IMPROVEMENTS_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('CONSOLIDADO') && !f.startsWith('INDEX'))
    .sort();

  const improvements = [];
  for (const file of files) {
    const filepath = path.join(IMPROVEMENTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const improvement = parseImprovementFile(content, file);
    
    // Extrair data do filename
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    improvement.data = dateMatch ? dateMatch[1] : 'unknown';
    
    improvements.push(improvement);
  }

  return improvements;
}

function groupByDate(improvements) {
  const groups = {};
  for (const imp of improvements) {
    if (!groups[imp.data]) groups[imp.data] = [];
    groups[imp.data].push(imp);
  }
  return groups;
}

function generateConsolidatedReport(improvements) {
  const timestamp = getTimestamp();
  const grouped = groupByDate(improvements);
  const dates = Object.keys(grouped).sort().reverse();
  
  let totalMelhorias = improvements.length;
  let locais = improvements.filter(i => i.tipo.includes('Local')).length;
  let prs = improvements.filter(i => i.tipo.includes('PR') || i.tipo.includes('Merge')).length;

  let report = `# 📦 CONSOLIDADO DE MELHORIAS

**Gerado em:** ${new Date().toLocaleString('pt-BR')}  
**Total de melhorias:** ${totalMelhorias}  
**Locais (backpressure):** ${locais}  
**PRs enviados:** ${prs}  

---

`;

  // Sumário por data
  report += `## 📅 Sumário por Data

| Data | Quantidade | Locais | PRs |
|------|-----------|--------|-----|
`;
  for (const date of dates.slice(0, 10)) {
    const imps = grouped[date];
    const l = imps.filter(i => i.tipo.includes('Local')).length;
    const p = imps.filter(i => i.tipo.includes('PR') || i.tipo.includes('Merge')).length;
    report += `| ${formatDate(date)} | ${imps.length} | ${l} | ${p} |\n`;
  }

  report += `
---

`;

  // Detalhamento por data
  for (const date of dates.slice(0, 5)) {
    report += `## ${formatDate(date)}\n\n`;
    const imps = grouped[date];
    
    for (const imp of imps.slice(0, 20)) {
      const emoji = getCategoryEmoji(imp.categoria);
      report += `- ${emoji} **${imp.categoria}**: ${imp.descricao.substring(0, 80)}${imp.descricao.length > 80 ? '...' : ''}\n`;
      if (imp.arquivoAlvo) {
        report += `  → \`${imp.arquivoAlvo}\`\n`;
      }
    }
    
    if (imps.length > 20) {
      report += `\n_E mais ${imps.length - 20} melhorias..._\n`;
    }
    
    report += '\n';
  }

  // Seção de ações pendentes
  const pendentes = improvements.filter(i => 
    i.raw.includes('🕐 Aguardando') || 
    i.raw.includes('backpressure') ||
    i.tipo.includes('Local')
  );

  if (pendentes.length > 0) {
    report += `## ⏳ Ações Pendentes (Backpressure)\n\n`;
    report += `Quando o backpressure liberar (≤5 PRs), estas melhorias devem ser implementadas:\n\n`;
    
    for (const imp of pendentes.slice(0, 15)) {
      report += `- [ ] **${imp.categoria}**: ${imp.descricao.substring(0, 60)}${imp.descricao.length > 60 ? '...' : ''}\n`;
      if (imp.arquivoAlvo) {
        report += `  - Arquivo: \`${imp.arquivoAlvo}\`\n`;
      }
    }
    
    if (pendentes.length > 15) {
      report += `\n_E mais ${pendentes.length - 15} pendentes..._\n`;
    }
  }

  // Estatísticas
  const categorias = {};
  for (const imp of improvements) {
    categorias[imp.categoria] = (categorias[imp.categoria] || 0) + 1;
  }

  report += `
---

## 📊 Estatísticas

### Por Categoria
`;
  const sortedCats = Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    const emoji = getCategoryEmoji(cat);
    report += `- ${emoji} ${cat}: ${count}\n`;
  }

  report += `
---

*Consolidado gerado automaticamente por Kaixa Jr* 🦊
`;

  return report;
}

function main() {
  console.log('🦊 Kaixa Improvement Consolidator\n');
  
  const improvements = loadImprovements();
  
  if (improvements.length === 0) {
    console.log('⚠️ Nenhuma melhoria encontrada em memory/improvements/');
    process.exit(0);
  }
  
  console.log(`📊 Total de melhorias carregadas: ${improvements.length}`);
  
  const report = generateConsolidatedReport(improvements);
  const outputFile = path.join(OUTPUT_DIR, `CONSOLIDADO-AUTO-${getTimestamp()}.md`);
  
  fs.writeFileSync(outputFile, report, 'utf-8');
  
  console.log(`\n✅ Consolidado gerado: ${outputFile}`);
  console.log(`   📈 ${improvements.length} melhorias documentadas`);
  
  const locais = improvements.filter(i => i.tipo.includes('Local')).length;
  if (locais > 0) {
    console.log(`   ⏳ ${locais} melhorias aguardando backpressure`);
  }
  
  // Se modo auto, também gera lista de tarefas
  if (process.argv.includes('--auto')) {
    const pendentes = improvements.filter(i => i.tipo.includes('Local'));
    if (pendentes.length > 0) {
      const todoFile = path.join(OUTPUT_DIR, `TODO-BACKPRESSURE-${getTimestamp()}.md`);
      let todo = `# 🎯 Tarefas Pendentes - Backpressure\n\n`;
      todo += `**Quando liberar (≤5 PRs), executar:**\n\n`;
      for (const imp of pendentes) {
        todo += `- [ ] ${imp.descricao.substring(0, 80)}\n`;
      }
      fs.writeFileSync(todoFile, todo, 'utf-8');
      console.log(`   📝 Lista de tarefas: ${todoFile}`);
    }
  }
}

main();
