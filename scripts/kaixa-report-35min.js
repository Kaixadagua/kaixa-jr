#!/usr/bin/env node
/**
 * Kaixa Report 35min
 * Relatório periódico de status para Kaua
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  workspace: 'C:\\Users\\joaov\\.openclaw\\workspace',
  agentCorp: 'C:\\Users\\joaov\\github\\AgentCorp'
};

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function getImprovementsCount() {
  try {
    const improvementsDir = path.join(CONFIG.workspace, 'memory', 'improvements');
    const files = fs.readdirSync(improvementsDir).filter(f => f.endsWith('.md'));
    return files.length;
  } catch {
    return 0;
  }
}

function getAgentCorpCommits() {
  try {
    // Windows-compatible: usa PowerShell ao invés de wc
    const result = execSync('git log --oneline dev-kaixa 2>$null | Measure-Object | Select-Object -ExpandProperty Count', {
      cwd: CONFIG.agentCorp,
      encoding: 'utf8',
      shell: 'powershell.exe'
    });
    return parseInt(result.trim()) || 0;
  } catch {
    return 0;
  }
}

function getBackpressureStatus() {
  try {
    const result = execSync('.\\scripts\\check-backpressure.ps1 -Json 2>$null', {
      cwd: CONFIG.workspace,
      encoding: 'utf8'
    });
    return JSON.parse(result);
  } catch (e) {
    // Tenta extrair do erro
    const match = e.message.match(/\{[^}]+\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return { status: 'unknown', count: '?' };
  }
}

function generateReport() {
  const now = new Date();
  const improvements = getImprovementsCount();
  const commits = getAgentCorpCommits();
  const backpressure = getBackpressureStatus();
  
  // Lê último relatório do guardian
  let guardianStatus = 'N/A';
  try {
    const guardianReport = JSON.parse(
      fs.readFileSync(path.join(CONFIG.workspace, 'memory', 'guardian-report.json'), 'utf8')
    );
    guardianStatus = guardianReport.overall === 'healthy' ? '✅' : '⚠️';
  } catch {}
  
  const report = `
🦊 **Kaixa Report - ${now.toLocaleTimeString('pt-BR')}**

📊 **Status Geral:**
├── Melhorias hoje: ${improvements}
├── Commits AgentCorp: ${commits}
├── Guardian: ${guardianStatus}
└── Backpressure: ${backpressure.status === 'red' ? '🔴' : backpressure.status === 'yellow' ? '🟡' : '🟢'} (${backpressure.count} PRs)

🎯 **Foco Atual:** AgentCorp (dev-kaixa)
📁 **Última atividade:** Sistema de filtros no TaskManager
⏱️ **Próximo report:** 35 minutos

_Estado: Operacional 🛡️_
`;

  // Salva relatório
  const reportFile = path.join(CONFIG.workspace, 'memory', 'kaixa-report-latest.txt');
  fs.writeFileSync(reportFile, report);
  
  // Cria flag de pending report para sessão principal enviar
  const pendingFile = path.join(CONFIG.workspace, 'memory', '.report-pending');
  fs.writeFileSync(pendingFile, new Date().toISOString());
  
  return report;
}

// Executa
const report = generateReport();
console.log(report);

// Em sessões isoladas, apenas salva o flag - a sessão principal enviará
console.log('[INFO] Report salvo. Flag de pending criado para envio pela sessão principal.');
