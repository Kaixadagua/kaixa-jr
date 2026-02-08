#!/usr/bin/env node
/**
 * 📊 consolidate-reports.js
 * 
 * Consolida reports pendentes do guardian em um único arquivo semanal.
 * Executado automaticamente ou manualmente quando há acúmulo de reports.
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'memory', 'reports');
const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');

function getWeekKey(date = new Date()) {
  const year = date.getFullYear();
  const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function consolidateReports() {
  console.log('[🦊] Consolidando reports pendentes...\n');

  if (!fs.existsSync(REPORTS_DIR)) {
    console.log('⚠️ Diretório de reports não existe. Criando...');
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('report-') && f.endsWith('.txt'))
    .map(f => ({
      name: f,
      path: path.join(REPORTS_DIR, f),
      mtime: fs.statSync(path.join(REPORTS_DIR, f)).mtime
    }))
    .sort((a, b) => a.mtime - b.mtime);

  if (files.length === 0) {
    console.log('✅ Nenhum report pendente para consolidar.');
    return;
  }

  const weekKey = getWeekKey();
  const consolidatedFile = path.join(REPORTS_DIR, `consolidated-${weekKey}.md`);
  
  let content = `# 📊 Reports Consolidados - ${weekKey}\n\n`;
  content += `> Gerado automaticamente em: ${new Date().toISOString()}\n\n`;
  content += `---\n\n`;

  let totalReports = 0;
  let totalImprovements = 0;

  for (const file of files) {
    const reportContent = fs.readFileSync(file.path, 'utf-8');
    const lines = reportContent.split('\n');
    
    // Extrair métricas
    const improvementMatch = reportContent.match(/Melhorias aplicadas: (\d+)/);
    const improvements = improvementMatch ? parseInt(improvementMatch[1]) : 0;
    totalImprovements += improvements;
    totalReports++;

    content += `## Report ${totalReports} - ${file.mtime.toISOString()}\n\n`;
    content += '```\n';
    content += reportContent;
    content += '\n```\n\n';
    content += `---\n\n`;

    // Remover arquivo individual
    fs.unlinkSync(file.path);
    console.log(`  🗑️ Removido: ${file.name}`);
  }

  content += `## 📈 Resumo da Semana\n\n`;
  content += `- **Total de reports:** ${totalReports}\n`;
  content += `- **Total de melhorias:** ${totalImprovements}\n`;
  content += `- **Média por report:** ${(totalImprovements / totalReports).toFixed(1)}\n\n`;

  fs.writeFileSync(consolidatedFile, content);

  console.log(`\n✅ Consolidado: ${files.length} reports → ${path.basename(consolidatedFile)}`);
  console.log(`📊 Total de melhorias na semana: ${totalImprovements}`);
}

if (require.main === module) {
  consolidateReports();
}

module.exports = { consolidateReports, getWeekKey };
