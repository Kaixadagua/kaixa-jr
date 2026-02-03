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
    const result = execSync('git log --oneline dev-kaixa | wc -l', {
      cwd: CONFIG.agentCorp,
      encoding: 'utf8'
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
  
  return report;
}

// Executa
const report = generateReport();
console.log(report);

// Envia mensagem se tiver gateway disponível
if (process.env.OPENCLAW_GATEWAY_URL) {
  try {
    execSync(`openclaw message send "${report.replace(/"/g, '\\"')}"`, {
      cwd: CONFIG.workspace
    });
  } catch {
    // Silencioso - não quebra se não conseguir enviar
  }
}
