#!/usr/bin/env node
/**
 * Kaixa Jr - Auto Report Consolidator
 * Processa relatórios pendentes e gera dashboard unificado
 * 
 * @module scripts/auto-report-consolidator
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), 'memory', 'reports');
const OUTPUT_FILE = path.join(process.cwd(), 'memory', 'reports', 'consolidated-dashboard.md');

/**
 * Extrai dados de um relatório
 * @param {string} content - Conteúdo do relatório
 * @returns {Object} Dados estruturados
 */
function parseReport(content) {
  const data = {
    timestamp: null,
    totalMelhorias: 0,
    backpressure: null,
    ultimaAtividade: null,
    raw: content
  };

  // Extrai timestamp do cabeçalho
  const timeMatch = content.match(/Relatório (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  if (timeMatch) data.timestamp = timeMatch[1];

  // Extrai total de melhorias
  const melhoriasMatch = content.match(/Total de melhorias:\s*(\d+)/);
  if (melhoriasMatch) data.totalMelhorias = parseInt(melhoriasMatch[1]);

  // Extrai backpressure
  const bpMatch = content.match(/Backpressure:\s*([🔴🟡🟢])\s*(\d+)\s*PRs?\s*\(([^)]+)\)/);
  if (bpMatch) {
    data.backpressure = {
      status: bpMatch[1],
      count: parseInt(bpMatch[2]),
      level: bpMatch[3]
    };
  }

  // Extrai última atividade
  const activityMatch = content.match(/Última atividade:\s*(.+)/);
  if (activityMatch) data.ultimaAtividade = activityMatch[1].trim();

  return data;
}

/**
 * Lista todos os relatórios pendentes
 * @returns {string[]} Caminhos dos relatórios
 */
function listPendingReports() {
  if (!fs.existsSync(REPORTS_DIR)) {
    return [];
  }

  return fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('report-') && f.endsWith('.txt'))
    .map(f => path.join(REPORTS_DIR, f))
    .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
}

/**
 * Gera o dashboard consolidado
 * @param {Object[]} reports - Lista de relatórios parseados
 */
function generateDashboard(reports) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  // Calcula métricas agregadas
  const totalMelhorias = reports.reduce((sum, r) => sum + (r.totalMelhorias || 0), 0);
  const avgBackpressure = reports.length > 0 
    ? Math.round(reports.reduce((sum, r) => sum + (r.backpressure?.count || 0), 0) / reports.length)
    : 0;
  
  // Status baseado no backpressure mais recente
  const latest = reports[0]?.backpressure;
  const statusIcon = latest?.status || '🟢';
  const statusText = latest?.level || 'Normal';

  const dashboard = `# 📊 Dashboard Consolidado de Relatórios

> Gerado automaticamente em: ${now}
> Total de relatórios processados: ${reports.length}

---

## 🎯 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Status Atual | ${statusIcon} ${statusText} |
| Backpressure Médio | ${avgBackpressure} PRs |
| Total de Melhorias | ${totalMelhorias} |
| Relatórios Hoje | ${reports.length} |

---

## 📈 Histórico de Relatórios

| # | Timestamp | Melhorias | Backpressure | Atividade |
|---|-----------|-----------|--------------|-----------|
${reports.map((r, i) => {
  const bp = r.backpressure ? `${r.backpressure.status} ${r.backpressure.count}` : '-';
  return `| ${i + 1} | ${r.timestamp || '-'} | ${r.totalMelhorias} | ${bp} | ${r.ultimaAtividade || '-'} |`;
}).join('\n')}

---

## 🦊 Kaixa Jr - Sempre em Movimento

*Dashboard atualizado automaticamente pelo consolidador de relatórios.*
`;

  fs.writeFileSync(OUTPUT_FILE, dashboard);
  console.log(`✅ Dashboard gerado: ${OUTPUT_FILE}`);
  
  return { reports: reports.length, totalMelhorias, avgBackpressure };
}

/**
 * Move relatórios processados para arquivados
 * @param {string[]} reportPaths - Caminhos dos relatórios
 */
function archiveReports(reportPaths) {
  const archiveDir = path.join(REPORTS_DIR, 'archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  for (const reportPath of reportPaths) {
    const filename = path.basename(reportPath);
    const destPath = path.join(archiveDir, filename);
    
    try {
      fs.renameSync(reportPath, destPath);
      console.log(`📦 Arquivado: ${filename}`);
    } catch (e) {
      console.warn(`⚠️ Erro ao arquivar ${filename}:`, e.message);
    }
  }
}

/**
 * Executa consolidação
 */
function run() {
  console.log('🦊 Auto Report Consolidator - Iniciando...\n');

  const reportPaths = listPendingReports();
  
  if (reportPaths.length === 0) {
    console.log('ℹ️ Nenhum relatório pendente para consolidar.');
    return { processed: 0 };
  }

  console.log(`📁 ${reportPaths.length} relatório(s) encontrado(s)\n`);

  // Parse todos os relatórios
  const reports = reportPaths.map(p => {
    const content = fs.readFileSync(p, 'utf8');
    return parseReport(content);
  });

  // Gera dashboard
  const stats = generateDashboard(reports);
  
  // Arquiva relatórios processados
  archiveReports(reportPaths);

  console.log('\n✅ Consolidação completa!');
  console.log(`   📊 ${stats.reports} relatórios processados`);
  console.log(`   📈 ${stats.totalMelhorias} melhorias totais`);
  console.log(`   🔴 ${stats.avgBackpressure} PRs em média (backpressure)`);

  return { 
    success: true, 
    processed: stats.reports,
    output: OUTPUT_FILE
  };
}

// Executa se chamado diretamente
if (require.main === module) {
  run();
}

module.exports = { run, parseReport, generateDashboard };
