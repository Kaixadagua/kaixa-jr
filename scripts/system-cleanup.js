#!/usr/bin/env node
/**
 * @fileoverview System Cleanup - Manutenção e limpeza do ambiente Kaixa Jr
 * @description Script para análise e limpeza segura de arquivos temporários,
 * logs antigos e arquivos de melhoria obsoletos. Mantém o sistema enxuto.
 * 
 * @author Kaixa Jr
 * @version 1.0.0
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * Configurações de limpeza
 * @typedef {Object} CleanupConfig
 * @property {number} maxAgeDays - Idade máxima em dias para arquivos
 * @property {string[]} safeExtensions - Extensões seguras para análise
 * @property {string[]} protectedPatterns - Padrões de arquivos protegidos
 */
const CONFIG = {
  maxAgeDays: 30,
  safeExtensions: ['.tmp', '.log', '.bak', '.old'],
  protectedPatterns: [
    'TRACKING.md',
    'metrics.json',
    'CONSOLIDADO-BATCH.md',
    /\.gitkeep$/
  ]
};

/**
 * Logger estruturado
 * @namespace CleanupLogger
 */
const Logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  success: (msg) => console.log(`[OK] ${msg}`),
  section: (title) => console.log(`\n📁 ${title}`)
};

/**
 * Calcula idade do arquivo em dias
 * @param {string} filePath - Caminho do arquivo
 * @returns {number} Idade em dias
 */
function getFileAgeDays(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const now = Date.now();
    const fileTime = stats.mtime.getTime();
    return Math.floor((now - fileTime) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Formata bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Verifica se arquivo está protegido
 * @param {string} filename - Nome do arquivo
 * @returns {boolean} true se protegido
 */
function isProtected(filename) {
  return CONFIG.protectedPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return filename.includes(pattern);
    }
    return pattern.test(filename);
  });
}

/**
 * Analisa arquivos de melhoria antigos
 * @returns {Object} Estatísticas de análise
 */
function analyzeImprovements() {
  const improvementsDir = path.join(process.cwd(), 'memory', 'improvements');
  
  if (!fs.existsSync(improvementsDir)) {
    return { count: 0, oldFiles: [], totalSize: 0 };
  }

  const files = fs.readdirSync(improvementsDir);
  const oldFiles = [];
  let totalSize = 0;

  files.forEach(file => {
    if (isProtected(file)) return;
    
    const filePath = path.join(improvementsDir, file);
    const stats = fs.statSync(filePath);
    
    if (!stats.isFile()) return;

    const age = getFileAgeDays(filePath);
    totalSize += stats.size;

    if (age > CONFIG.maxAgeDays) {
      oldFiles.push({
        name: file,
        age: age,
        size: stats.size,
        path: filePath
      });
    }
  });

  return {
    count: files.length,
    oldFiles: oldFiles.sort((a, b) => b.age - a.age),
    totalSize: totalSize
  };
}

/**
 * Analisa arquivos temporários no workspace
 * @returns {Object} Lista de arquivos temporários
 */
function analyzeTempFiles() {
  const tempPatterns = ['.tmp', '.temp', '.log', '.bak', '.old', 'debug.log'];
  const tempFiles = [];

  function scanDir(dir, depth = 0) {
    if (depth > 3) return; // Limitar profundidade

    try {
      const entries = fs.readdirSync(dir);
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // Pular diretórios protegidos
          if (!['node_modules', '.git', 'aurahub'].includes(entry)) {
            scanDir(fullPath, depth + 1);
          }
        } else {
          const isTemp = tempPatterns.some(pattern => 
            entry.toLowerCase().includes(pattern)
          );
          
          if (isTemp) {
            tempFiles.push({
              name: entry,
              path: fullPath,
              size: stats.size,
              age: getFileAgeDays(fullPath)
            });
          }
        }
      });
    } catch (err) {
      // Ignorar erros de permissão
    }
  }

  scanDir(process.cwd());
  return tempFiles.sort((a, b) => b.age - a.age);
}

/**
 * Analisa relatórios do guardian
 * @returns {Object} Estatísticas de relatórios
 */
function analyzeReports() {
  const reportsDir = path.join(process.cwd(), 'memory', 'reports');
  const guardianDir = path.join(process.cwd(), 'scripts', 'reports');
  
  const reports = [];

  [reportsDir, guardianDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          reports.push({
            name: file,
            path: filePath,
            size: stats.size,
            age: getFileAgeDays(filePath),
            type: dir.includes('guardian') ? 'guardian' : 'system'
          });
        }
      });
    } catch (err) {
      // Ignorar erros
    }
  });

  const oldReports = reports.filter(r => r.age > 14); // +14 dias
  
  return {
    total: reports.length,
    oldReports: oldReports.sort((a, b) => b.age - a.age),
    totalSize: reports.reduce((sum, r) => sum + r.size, 0)
  };
}

/**
 * Gera resumo executivo
 * @param {Object} analysis - Resultado das análises
 */
function printSummary(analysis) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DE MANUTENÇÃO DO SISTEMA');
  console.log('='.repeat(50));

  // Melhorias
  Logger.section('Melhorias');
  Logger.info(`Total de arquivos: ${analysis.improvements.count}`);
  Logger.info(`Arquivos antigos (+${CONFIG.maxAgeDays}d): ${analysis.improvements.oldFiles.length}`);
  if (analysis.improvements.oldFiles.length > 0) {
    const totalOldSize = analysis.improvements.oldFiles.reduce((s, f) => s + f.size, 0);
    Logger.warn(`Espaço potencial: ${formatBytes(totalOldSize)}`);
    console.log('  Arquivos mais antigos:');
    analysis.improvements.oldFiles.slice(0, 5).forEach(f => {
      console.log(`    - ${f.name} (${f.age}d, ${formatBytes(f.size)})`);
    });
  }

  // Temp files
  Logger.section('Arquivos Temporários');
  Logger.info(`Encontrados: ${analysis.tempFiles.length}`);
  if (analysis.tempFiles.length > 0) {
    const tempSize = analysis.tempFiles.reduce((s, f) => s + f.size, 0);
    Logger.warn(`Tamanho total: ${formatBytes(tempSize)}`);
  }

  // Reports
  Logger.section('Relatórios');
  Logger.info(`Total: ${analysis.reports.total}`);
  Logger.info(`Antigos (+14d): ${analysis.reports.oldReports.length}`);
  if (analysis.reports.oldReports.length > 0) {
    const oldSize = analysis.reports.oldReports.reduce((s, r) => s + r.size, 0);
    Logger.warn(`Espaço recuperável: ${formatBytes(oldSize)}`);
  }

  // Recomendações
  Logger.section('Recomendações');
  const totalRecoverable = 
    analysis.improvements.oldFiles.reduce((s, f) => s + f.size, 0) +
    analysis.reports.oldReports.reduce((s, r) => s + r.size, 0);

  if (totalRecoverable > 1024 * 1024) { // > 1MB
    Logger.warn(`💡 Cleanup recomendado: ${formatBytes(totalRecoverable)} recuperáveis`);
    console.log('  Execute: node scripts/system-cleanup.js --dry-run');
  } else {
    Logger.success('✅ Sistema saudável - nenhuma ação necessária');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🦊 Kaixa Jr System Cleanup v1.0.0');
  console.log('='.repeat(50) + '\n');
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isVerbose = args.includes('--verbose') || args.includes('-v');

  console.log('🧹 Kaixa Jr - System Cleanup');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (simulação)' : 'ANÁLISE'}`);
  console.log('');

  const analysis = {
    improvements: analyzeImprovements(),
    tempFiles: analyzeTempFiles(),
    reports: analyzeReports()
  };

  printSummary(analysis);

  // Retornar código para scripts
  const hasIssues = 
    analysis.improvements.oldFiles.length > 0 ||
    analysis.tempFiles.length > 0 ||
    analysis.reports.oldReports.length > 0;

  process.exit(hasIssues ? 1 : 0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeImprovements,
  analyzeTempFiles,
  analyzeReports,
  formatBytes,
  getFileAgeDays
};
