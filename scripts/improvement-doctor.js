#!/usr/bin/env node
/**
 * improvement-doctor.js
 * Diagnóstico completo do sistema de melhoria contínua Kaixa Jr
 * 
 * Uso: node scripts/improvement-doctor.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(process.cwd(), 'memory', 'improvements');
const REPORTS_DIR = path.join(process.cwd(), 'scripts', 'reports');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

class ImprovementDoctor {
  constructor(options = {}) {
    this.options = options;
    this.issues = [];
    this.stats = {
      totalImprovements: 0,
      localImprovements: 0,
      prImprovements: 0,
      orphanedFiles: 0,
      missingMetadata: 0,
      lastImprovement: null,
      avgTimeBetween: 0,
    };
  }

  log(message, level = 'info') {
    const prefix = {
      info: colorize('[ℹ]', 'blue'),
      success: colorize('[✓]', 'green'),
      warning: colorize('[⚠]', 'yellow'),
      error: colorize('[✗]', 'red'),
    }[level] || '[ ]';
    
    console.log(`${prefix} ${message}`);
  }

  // Check 1: Verificar estrutura do diretório
  checkDirectoryStructure() {
    this.log('\n📁 Verificando estrutura de diretórios...', 'info');
    
    const requiredDirs = [
      IMPROVEMENTS_DIR,
      REPORTS_DIR,
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        this.issues.push({
          type: 'error',
          message: `Diretório ausente: ${path.relative(process.cwd(), dir)}`,
          fixable: true,
        });
        this.log(`Diretório ausente: ${dir}`, 'error');
      } else {
        this.log(`${path.relative(process.cwd(), dir)} - OK`, 'success');
      }
    }
  }

  // Check 2: Analisar melhorias existentes
  analyzeImprovements() {
    this.log('\n📊 Analisando melhorias existentes...', 'info');
    
    if (!fs.existsSync(IMPROVEMENTS_DIR)) {
      return;
    }
    
    const files = fs.readdirSync(IMPROVEMENTS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort();
    
    this.stats.totalImprovements = files.length;
    
    let localCount = 0;
    let prCount = 0;
    let timestamps = [];
    
    for (const file of files) {
      const filePath = path.join(IMPROVEMENTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);
      
      // Detectar tipo de melhoria
      if (content.includes('Implementada localmente')) {
        localCount++;
      } else if (content.includes('PR criado') || content.includes('github.com')) {
        prCount++;
      }
      
      // Extrair timestamp do conteúdo ou do arquivo
      const contentMatch = content.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
      if (contentMatch) {
        timestamps.push(new Date(contentMatch[1]));
      } else {
        timestamps.push(stats.mtime);
      }
      
      // Verificar metadados obrigatórios
      const requiredFields = ['Tipo', 'Categoria', 'Descrição'];
      for (const field of requiredFields) {
        if (!content.includes(field)) {
          this.stats.missingMetadata++;
          if (this.options.verbose) {
            this.log(`${file} - campo ausente: ${field}`, 'warning');
          }
        }
      }
    }
    
    this.stats.localImprovements = localCount;
    this.stats.prImprovements = prCount;
    
    // Calcular tempo médio entre melhorias
    if (timestamps.length > 1) {
      timestamps.sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
      }
      this.stats.avgTimeBetween = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      this.stats.lastImprovement = timestamps[timestamps.length - 1];
    }
    
    this.log(`Total: ${files.length} melhorias`, 'info');
    this.log(`  Local: ${localCount} | PR: ${prCount}`, 'info');
    
    if (this.stats.avgTimeBetween > 0) {
      this.log(`Tempo médio entre melhorias: ${formatDuration(this.stats.avgTimeBetween)}`, 'info');
    }
    
    if (this.stats.lastImprovement) {
      const timeSince = Date.now() - this.stats.lastImprovement;
      const color = timeSince > 3600000 ? 'yellow' : 'green'; // > 1h
      this.log(`Última melhoria: ${formatDuration(timeSince)} atrás`, color === 'yellow' ? 'warning' : 'success');
    }
  }

  // Check 3: Verificar arquivos órfãos
  checkOrphanedFiles() {
    this.log('\n🔍 Verificando arquivos órfãos...', 'info');
    
    const expectedFiles = ['metrics.json', 'TRACKING.md', 'INDEX.md'];
    const existingFiles = fs.existsSync(IMPROVEMENTS_DIR) 
      ? fs.readdirSync(IMPROVEMENTS_DIR)
      : [];
    
    // Verificar se há melhorias sem arquivo de resumo correspondente
    const melhoriaFiles = existingFiles.filter(f => 
      f.match(/^\d{4}-\d{2}-\d{2}T/) && !f.includes('CONSOLIDADO')
    );
    
    const resumoFiles = existingFiles.filter(f => 
      f.startsWith('RESUMO-') || f.startsWith('CONSOLIDADO')
    );
    
    this.log(`${melhoriaFiles.length} melhorias individuais`, 'info');
    this.log(`${resumoFiles.length} arquivos de consolidação`, 'info');
    
    // Alertar se muitas melhorias sem consolidação recente
    if (melhoriaFiles.length > 20 && resumoFiles.length === 0) {
      this.issues.push({
        type: 'warning',
        message: 'Muitas melhorias sem consolidação. Considere rodar improvement-consolidator.js',
        fixable: true,
      });
      this.log('⚠ Muitas melhorias sem consolidação recente', 'warning');
    }
  }

  // Check 4: Verificar relatórios do guardian
  checkGuardianReports() {
    this.log('\n🤖 Verificando relatórios do Guardian...', 'info');
    
    if (!fs.existsSync(REPORTS_DIR)) {
      this.issues.push({
        type: 'warning',
        message: 'Diretório de relatórios não existe',
        fixable: true,
      });
      return;
    }
    
    const reportFiles = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.startsWith('guardian-') && f.endsWith('.json'))
      .sort();
    
    if (reportFiles.length === 0) {
      this.log('Nenhum relatório do Guardian encontrado', 'warning');
      return;
    }
    
    const latestReport = reportFiles[reportFiles.length - 1];
    const reportPath = path.join(REPORTS_DIR, latestReport);
    
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const lastEntry = report[report.length - 1];
      
      if (lastEntry) {
        const reportTime = new Date(lastEntry.timestamp);
        const timeSince = Date.now() - reportTime;
        
        this.log(`Último relatório: ${latestReport}`, 'info');
        this.log(`Status: ${lastEntry.status || 'unknown'}`, 
          lastEntry.status === 'healthy' ? 'success' : 'warning');
        
        if (lastEntry.backpressure) {
          const bpColor = lastEntry.backpressure.status === 'red' ? 'red' : 
                         lastEntry.backpressure.status === 'yellow' ? 'yellow' : 'green';
          this.log(`Backpressure: ${lastEntry.backpressure.count} PRs (${lastEntry.backpressure.status})`, bpColor);
        }
        
        if (timeSince > 7200000) { // > 2h
          this.issues.push({
            type: 'warning',
            message: `Guardian inativo há ${formatDuration(timeSince)}`,
            fixable: false,
          });
        }
      }
    } catch (e) {
      this.issues.push({
        type: 'error',
        message: `Erro ao ler relatório: ${e.message}`,
        fixable: false,
      });
    }
  }

  // Check 5: Verificar métricas
  checkMetrics() {
    this.log('\n📈 Verificando métricas...', 'info');
    
    const metricsPath = path.join(IMPROVEMENTS_DIR, 'metrics.json');
    
    if (!fs.existsSync(metricsPath)) {
      this.issues.push({
        type: 'warning',
        message: 'Arquivo de métricas não existe',
        fixable: true,
      });
      this.log('Arquivo de métricas não encontrado', 'warning');
      return;
    }
    
    try {
      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
      
      this.log(`Total de ciclos: ${metrics.totalCycles || 0}`, 'info');
      this.log(`Melhorias por hora: ${metrics.improvementsPerHour?.toFixed(2) || 'N/A'}`, 'info');
      this.log(`Backpressure events: ${metrics.backpressureEvents || 0}`, 'info');
      
      if (metrics.improvementsPerHour && metrics.improvementsPerHour < 5) {
        this.issues.push({
          type: 'warning',
          message: 'Throughput abaixo do esperado (< 5 melhorias/hora)',
          fixable: false,
        });
      }
    } catch (e) {
      this.issues.push({
        type: 'error',
        message: `Erro ao ler métricas: ${e.message}`,
        fixable: false,
      });
    }
  }

  // Executar todos os checks
  runAllChecks() {
    console.log(colorize('\n═══════════════════════════════════════════', 'magenta'));
    console.log(colorize('   🔧 IMPROVEMENT DOCTOR - Kaixa Jr', 'magenta'));
    console.log(colorize('═══════════════════════════════════════════\n', 'magenta'));
    
    this.checkDirectoryStructure();
    this.analyzeImprovements();
    this.checkOrphanedFiles();
    this.checkGuardianReports();
    this.checkMetrics();
    
    this.generateReport();
  }

  generateReport() {
    console.log(colorize('\n═══════════════════════════════════════════', 'magenta'));
    console.log(colorize('   📋 RELATÓRIO FINAL', 'magenta'));
    console.log(colorize('═══════════════════════════════════════════\n', 'magenta'));
    
    if (this.issues.length === 0) {
      this.log(colorize('✅ Sistema saudável! Nenhum problema encontrado.', 'green'), 'success');
    } else {
      const errors = this.issues.filter(i => i.type === 'error');
      const warnings = this.issues.filter(i => i.type === 'warning');
      
      if (errors.length > 0) {
        console.log(colorize(`\n${errors.length} ERRO(S):`, 'red'));
        errors.forEach(issue => console.log(`  ✗ ${issue.message}`));
      }
      
      if (warnings.length > 0) {
        console.log(colorize(`\n${warnings.length} AVISO(S):`, 'yellow'));
        warnings.forEach(issue => console.log(`  ⚠ ${issue.message}`));
      }
      
      const fixable = this.issues.filter(i => i.fixable).length;
      if (fixable > 0 && this.options.fix) {
        console.log(colorize(`\n${fixable} problema(s) podem ser corrigidos automaticamente.`, 'blue'));
        console.log('Execute com --fix para tentar correção automática.');
      }
    }
    
    // Summary
    console.log(colorize('\n─── Resumo ───', 'cyan'));
    console.log(`Melhorias: ${this.stats.totalImprovements} (Local: ${this.stats.localImprovements}, PR: ${this.stats.prImprovements})`);
    console.log(`Metadados ausentes: ${this.stats.missingMetadata}`);
    console.log(`Problemas: ${this.issues.length} (${this.issues.filter(i => i.type === 'error').length} erros, ${this.issues.filter(i => i.type === 'warning').length} avisos)`);
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
};

const doctor = new ImprovementDoctor(options);
doctor.runAllChecks();
