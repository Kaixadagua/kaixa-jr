#!/usr/bin/env node
/**
 * @fileoverview Kaixa Dashboard CLI - Visão unificada do sistema
 * @description Dashboard de linha de comando para monitorar todos os aspectos do sistema Kaixa Jr
 * 
 * @author Kaixa Jr
 * @created 2026-02-08
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores ANSI
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const ICONS = {
  fox: '🦊',
  health: '💓',
  git: '🌿',
  docs: '📝',
  sync: '🔄',
  time: '⏱️',
  check: '✅',
  warn: '⚠️',
  error: '❌',
};

class KaixaDashboard {
  constructor() {
    this.workspace = process.cwd();
    this.data = {
      timestamp: new Date().toISOString(),
      health: {},
      git: {},
      improvements: {},
      backpressure: {},
    };
  }

  async run() {
    console.clear();
    this.header();
    
    await this.checkHealth();
    await this.checkGit();
    await this.checkImprovements();
    await this.checkBackpressure();
    
    this.summary();
    this.footer();
  }

  header() {
    const now = new Date().toLocaleString('pt-BR');
    console.log(`
${C.cyan}${C.bold}┌─────────────────────────────────────────────────────────────┐${C.reset}
${C.cyan}${C.bold}│  ${ICONS.fox} KAIXA DASHBOARD v1.0.0                                   │${C.reset}
${C.cyan}${C.bold}│  ${C.dim}${now}${' '.repeat(49 - now.length)}│${C.reset}
${C.cyan}${C.bold}└─────────────────────────────────────────────────────────────┘${C.reset}
`);
  }

  async checkHealth() {
    this.section('Health Status', ICONS.health);
    
    const reportPath = path.join(this.workspace, 'scripts', 'reports', 'guardian-2026-02-08.json');
    
    try {
      if (fs.existsSync(reportPath)) {
        const reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const latest = reports[reports.length - 1];
        
        if (latest) {
          const status = latest.status === 'healthy' ? C.green : C.yellow;
          console.log(`  ${ICONS.check} Status: ${status}${latest.status.toUpperCase()}${C.reset}`);
          console.log(`  ${ICONS.time} Último check: ${new Date(latest.timestamp).toLocaleTimeString('pt-BR')}`);
          console.log(`  📊 Tokens: ${latest.totalTokens?.toLocaleString() || 0}`);
          console.log(`  🤖 Agentes: ${latest.agentCount || 0}`);
          
          if (latest.backpressure) {
            const bpColor = latest.backpressure.status === 'red' ? C.red : 
                           latest.backpressure.status === 'yellow' ? C.yellow : C.green;
            console.log(`  ${ICONS.warn} Backpressure: ${bpColor}${latest.backpressure.count} PRs${C.reset}`);
          }
        }
      } else {
        console.log(`  ${ICONS.warn} Nenhum report encontrado`);
      }
    } catch (err) {
      console.log(`  ${ICONS.error} Erro ao ler health: ${err.message}`);
    }
  }

  async checkGit() {
    this.section('Git Status', ICONS.git);
    
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: this.workspace }).trim();
      const status = execSync('git status --short', { encoding: 'utf8', cwd: this.workspace }).trim();
      
      console.log(`  🌿 Branch: ${C.cyan}${branch}${C.reset}`);
      
      if (status) {
        const lines = status.split('\n').filter(l => l.trim());
        console.log(`  ${ICONS.warn} Alterações pendentes: ${lines.length} arquivo(s)`);
        lines.slice(0, 3).forEach(line => {
          console.log(`     ${C.dim}${line}${C.reset}`);
        });
        if (lines.length > 3) {
          console.log(`     ${C.dim}... e mais ${lines.length - 3}${C.reset}`);
        }
      } else {
        console.log(`  ${ICONS.check} Working directory limpo`);
      }
    } catch (err) {
      console.log(`  ${ICONS.error} Erro ao verificar git: ${err.message}`);
    }
  }

  async checkImprovements() {
    this.section('Melhorias', ICONS.docs);
    
    const improvementsDir = path.join(this.workspace, 'memory', 'improvements');
    
    try {
      if (fs.existsSync(improvementsDir)) {
        const files = fs.readdirSync(improvementsDir).filter(f => f.endsWith('.md'));
        console.log(`  📄 Total de melhorias: ${files.length}`);
        
        // Contar por data
        const today = new Date().toISOString().split('T')[0];
        const todayFiles = files.filter(f => f.startsWith(today));
        console.log(`  📅 Hoje: ${C.green}${todayFiles.length}${C.reset}`);
        
        if (todayFiles.length > 0) {
          console.log(`  ${C.dim}  Últimas:${C.reset}`);
          todayFiles.slice(-3).forEach(f => {
            console.log(`    • ${f.replace('.md', '')}`);
          });
        }
      } else {
        console.log(`  ${ICONS.warn} Diretório de melhorias não encontrado`);
      }
    } catch (err) {
      console.log(`  ${ICONS.error} Erro: ${err.message}`);
    }
  }

  async checkBackpressure() {
    this.section('Backpressure', ICONS.sync);
    
    try {
      // Tentar obter via gh CLI
      const result = execSync('gh pr list --repo aura-io-saas/aurahub --state open --json number --jq length', { 
        encoding: 'utf8', 
        cwd: this.workspace,
        timeout: 10000
      }).trim();
      
      const count = parseInt(result, 10) || 0;
      const color = count >= 9 ? C.red : count >= 6 ? C.yellow : C.green;
      const status = count >= 9 ? '🔴 CRÍTICO' : count >= 6 ? '🟡 ATENÇÃO' : '🟢 OK';
      
      console.log(`  ${ICONS.sync} PRs abertos: ${color}${count}${C.reset}`);
      console.log(`  📊 Status: ${color}${status}${C.reset}`);
      
      if (count >= 9) {
        console.log(`  ${C.red}  → Modo backpressure ativo (melhorias locais)${C.reset}`);
      }
    } catch (err) {
      console.log(`  ${ICONS.warn} Não foi possível verificar PRs (gh CLI indisponível)`);
    }
  }

  section(title, icon) {
    console.log(`\n${C.bold}${icon} ${title}${C.reset}`);
    console.log(`${C.dim}${'─'.repeat(50)}${C.reset}`);
  }

  summary() {
    console.log(`\n${C.cyan}${C.bold}┌─────────────────────────────────────────────────────────────┐${C.reset}`);
    console.log(`${C.cyan}${C.bold}│  ${ICONS.fox} Sistema operacional - Kaixa Jr pronta para ação!          │${C.reset}`);
    console.log(`${C.cyan}${C.bold}└─────────────────────────────────────────────────────────────┘${C.reset}`);
  }

  footer() {
    console.log(`\n${C.dim}Use: node scripts/kaixa-dashboard.js [--json] [--watch]${C.reset}\n`);
  }
}

// CLI arguments
const args = process.argv.slice(2);

if (args.includes('--json')) {
  // Modo JSON para integração
  const dash = new KaixaDashboard();
  console.log(JSON.stringify(dash.data, null, 2));
} else {
  // Modo normal
  const dash = new KaixaDashboard();
  dash.run().catch(err => {
    console.error(`${ICONS.error} Erro:`, err.message);
    process.exit(1);
  });
}

module.exports = KaixaDashboard;
