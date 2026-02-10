#!/usr/bin/env node
/**
 * kaixa-report-35min.js - Relatório periódico de 35 minutos
 * 
 * Gera relatório de atividades da Kaixa Jr para Kaua
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const REPORTS_DIR = path.join(__dirname, '..', 'memory', 'reports');
const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function countImprovements() {
  try {
    const files = fs.readdirSync(IMPROVEMENTS_DIR);
    return files.filter(f => f.endsWith('.md') && f.includes('melhoria')).length;
  } catch {
    return 0;
  }
}

function getLatestImprovements(limit = 5) {
  try {
    const files = fs.readdirSync(IMPROVEMENTS_DIR)
      .filter(f => f.endsWith('.md') && f.includes('melhoria'))
      .map(f => ({
        name: f,
        path: path.join(IMPROVEMENTS_DIR, f),
        mtime: fs.statSync(path.join(IMPROVEMENTS_DIR, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    return files.map(f => {
      try {
        const content = fs.readFileSync(f.path, 'utf8');
        // Extrai tipo da linha ## Tipo
        const typeMatch = content.match(/## Tipo\s*\n([^\n]+)/);
        // Extrai descrição da linha ## Descrição
        const descMatch = content.match(/## Descri(?:ç|c)(?:ã|a)o\s*\n([^\n]+)/);
        return {
          id: path.basename(f.name, '.md'),
          type: typeMatch ? typeMatch[1].trim().replace(/^[^a-zA-Z]+/, '') : 'unknown',
          description: descMatch ? descMatch[1].trim() : 'Sem descrição',
          timestamp: f.mtime.toISOString()
        };
      } catch {
        return { id: path.basename(f.name, '.md'), type: 'unknown', description: 'Erro ao ler', timestamp: f.mtime.toISOString() };
      }
    });
  } catch {
    return [];
  }
}

function getBackpressureStatus() {
  try {
    // Tenta obter de gh
    const result = execSync('gh pr list --repo Kaixadagua/kaixa-jr --state open --json number 2>nul || echo "[]"', { encoding: 'utf8', timeout: 10000 });
    const prs = JSON.parse(result || '[]');
    const count = Array.isArray(prs) ? prs.length : 0;
    
    let status = '🟢';
    let text = 'Normal';
    if (count >= 9) { status = '🔴'; text = 'Crítico'; }
    else if (count >= 6) { status = '🟡'; text = 'Atenção'; }
    
    return { count, status, text };
  } catch {
    return { count: '?', status: '⚪', text: 'Desconhecido' };
  }
}

function getLastImprovementTime() {
  try {
    const files = fs.readdirSync(IMPROVEMENTS_DIR)
      .filter(f => f.endsWith('.md') && f.includes('melhoria'))
      .map(f => fs.statSync(path.join(IMPROVEMENTS_DIR, f)).mtime)
      .sort((a, b) => b - a);
    
    if (files.length === 0) return null;
    return files[0];
  } catch {
    return null;
  }
}

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h${remainingMins}min`;
}

function generateReport() {
  const now = new Date();
  const totalImprovements = countImprovements();
  const latest = getLatestImprovements(3);
  const bp = getBackpressureStatus();
  const lastTime = getLastImprovementTime();
  const timeSinceLast = lastTime ? formatDuration(now - lastTime) : 'N/A';

  let report = '';
  report += `${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`;
  report += `${colors.bright}  🦊 KAIXA JR - Relatório ${colors.cyan}${getTimestamp()}${colors.reset}\n`;
  report += `${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n\n`;

  report += `${colors.bright}📊 Status Geral${colors.reset}\n`;
  report += `  Total de melhorias: ${colors.green}${totalImprovements}${colors.reset}\n`;
  report += `  Última atividade: ${colors.yellow}${timeSinceLast} atrás${colors.reset}\n`;
  report += `  Backpressure: ${bp.status} ${bp.count} PRs (${bp.text})\n\n`;

  if (latest.length > 0) {
    report += `${colors.bright}📝 Últimas Melhorias${colors.reset}\n`;
    latest.forEach((imp, i) => {
      const icon = ['🥇', '🥈', '🥉'][i] || '•';
      report += `  ${icon} ${colors.cyan}${imp.id}${colors.reset} [${imp.type}]\n`;
      report += `    ${imp.description.substring(0, 50)}${imp.description.length > 50 ? '...' : ''}\n`;
    });
    report += '\n';
  }

  report += `${colors.gray}Próximo relatório em ~35 minutos${colors.reset}\n`;
  report += `${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`;

  return report;
}

function main() {
  try {
    // Garante diretórios
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const report = generateReport();
    console.log(report);

    // Salva relatório
    const reportFile = path.join(REPORTS_DIR, `report-${Date.now()}.txt`);
    fs.writeFileSync(reportFile, report.replace(/\x1b\[\d+m/g, ''), 'utf8');

    // Output para ser usado pelo cron
    console.log(`\n📄 Relatório salvo: ${reportFile}`);
    
    return 0;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao gerar relatório:${colors.reset}`, error.message);
    return 1;
  }
}

process.exit(main());
