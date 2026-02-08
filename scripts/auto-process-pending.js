#!/usr/bin/env node
/**
 * @fileoverview Auto-Processador de Melhorias Pendentes
 * 
 * Detecta arquivos de melhoria pendentes em `memory/improvements/`*-melhoria.md`
 * e os integra automaticamente no TRACKING.md, evitando duplicatas.
 * 
 * @module scripts/auto-process-pending
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/** @constant {string} */
const IMPROVEMENTS_DIR = path.join(process.cwd(), 'memory', 'improvements');

/** @constant {string} */
const TRACKING_FILE = path.join(IMPROVEMENTS_DIR, 'TRACKING.md');

/** @constant {RegExp} */
const PENDING_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-melhoria\.md$/;

/**
 * Logger estruturado para melhorias
 * @namespace ImprovementLogger
 */
const ImprovementLogger = {
  /**
   * @param {string} message
   * @param {Object} [meta]
   */
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta.file ? `(${meta.file})` : '');
  },
  
  /**
   * @param {string} message
   * @param {Object} [meta]
   */
  warn: (message, meta = {}) => {
    console.log(`[WARN] ${message}`, meta.file ? `(${meta.file})` : '');
  },
  
  /**
   * @param {string} message
   * @param {Error} [error]
   */
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error ? `: ${error.message}` : '');
  }
};

/**
 * Encontra arquivos de melhoria pendentes
 * @returns {string[]} Lista de caminhos de arquivos pendentes
 */
function findPendingImprovements() {
  try {
    if (!fs.existsSync(IMPROVEMENTS_DIR)) {
      ImprovementLogger.warn('Diretório de melhorias não existe', { dir: IMPROVEMENTS_DIR });
      return [];
    }

    const files = fs.readdirSync(IMPROVEMENTS_DIR);
    const pending = files
      .filter(file => PENDING_PATTERN.test(file))
      .map(file => path.join(IMPROVEMENTS_DIR, file));

    ImprovementLogger.info(`Encontrados ${pending.length} arquivo(s) pendente(s)`);
    return pending;
  } catch (error) {
    ImprovementLogger.error('Erro ao buscar melhorias pendentes', error);
    return [];
  }
}

/**
 * Extrai informações do arquivo de melhoria
 * @param {string} filePath - Caminho do arquivo
 * @returns {Object|null} Dados da melhoria ou null
 */
function parseImprovementFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    
    // Extrai data do nome: 2026-02-08T18-19-58-melhoria.md
    const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
    const timestamp = dateMatch 
      ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}`
      : new Date().toISOString().slice(0, 16).replace('T', ' ');

    // Extrai título (primeira linha que não está vazia e não é markdown)
    const lines = content.split('\n');
    let title = 'Melhoria Pendente';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        title = trimmed.slice(0, 60);
        break;
      }
    }

    // Determina tipo pela categoria ou conteúdo
    let type = 'local';
    if (content.includes('PR') || content.includes('branch')) type = 'pr';
    if (content.includes('docs') || content.includes('README')) type = 'docs';
    if (content.includes('refactor')) type = 'refactor';
    if (content.includes('test')) type = 'test';

    return {
      filename,
      timestamp,
      title,
      type,
      content: content.slice(0, 500) // Primeiros 500 chars para preview
    };
  } catch (error) {
    ImprovementLogger.error(`Erro ao parsear ${filePath}`, error);
    return null;
  }
}

/**
 * Verifica se melhoria já existe no tracking
 * @param {string} trackingContent - Conteúdo do TRACKING.md
 * @param {string} filename - Nome do arquivo de melhoria
 * @returns {boolean}
 */
function isAlreadyTracked(trackingContent, filename) {
  return trackingContent.includes(filename);
}

/**
 * Gera entrada para o TRACKING.md
 * @param {Object} improvement - Dados da melhoria
 * @param {number} number - Número da melhoria
 * @returns {string}
 */
function generateTrackingEntry(improvement, number) {
  const typeEmoji = {
    pr: '🔗',
    docs: '📄',
    refactor: '♻️',
    test: '🧪',
    local: '📝'
  }[improvement.type] || '📝';

  return `
### Melhoria #${number} (${improvement.timestamp}) - ${typeEmoji} ${improvement.type.toUpperCase()}
**Arquivo:** \`${improvement.filename}\` → **${improvement.title}**
- Processado automaticamente pelo auto-process-pending
- Tipo detectado: ${improvement.type}
- 🎯 **${number} melhorias totais!** Sistema de gestão de pendentes ativo!
`;
}

/**
 * Processa todas as melhorias pendentes
 * @returns {Object} Resultado do processamento
 */
function processPendingImprovements() {
  const pending = findPendingImprovements();
  
  if (pending.length === 0) {
    ImprovementLogger.info('Nenhuma melhoria pendente para processar');
    return { processed: 0, skipped: 0, errors: 0 };
  }

  // Lê tracking atual
  let trackingContent = '';
  if (fs.existsSync(TRACKING_FILE)) {
    trackingContent = fs.readFileSync(TRACKING_FILE, 'utf-8');
  }

  // Encontra maior número de melhoria atual
  const numberMatch = trackingContent.match(/Melhoria #(\d+)/g);
  let currentNumber = 0;
  if (numberMatch) {
    const numbers = numberMatch.map(m => parseInt(m.match(/\d+/)[0]));
    currentNumber = Math.max(...numbers);
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of pending) {
    const filename = path.basename(filePath);
    
    // Verifica duplicata
    if (isAlreadyTracked(trackingContent, filename)) {
      ImprovementLogger.warn('Melhoria já rastreada, pulando', { file: filename });
      skipped++;
      continue;
    }

    // Parseia melhoria
    const improvement = parseImprovementFile(filePath);
    if (!improvement) {
      errors++;
      continue;
    }

    // Gera e adiciona entrada
    currentNumber++;
    const entry = generateTrackingEntry(improvement, currentNumber);
    
    // Insere após o header "## Dashboard"
    const dashboardMatch = trackingContent.match(/## Dashboard[\s\S]*?(?=\n## |\n### |$)/);
    if (dashboardMatch) {
      const insertPos = dashboardMatch.index + dashboardMatch[0].length;
      trackingContent = trackingContent.slice(0, insertPos) + entry + trackingContent.slice(insertPos);
    } else {
      trackingContent += entry;
    }

    // Remove arquivo processado
    try {
      fs.unlinkSync(filePath);
      ImprovementLogger.info(`Processado e removido`, { file: filename });
      processed++;
    } catch (error) {
      ImprovementLogger.error(`Erro ao remover ${filename}`, error);
      errors++;
    }
  }

  // Salva tracking atualizado
  if (processed > 0) {
    try {
      fs.writeFileSync(TRACKING_FILE, trackingContent);
      ImprovementLogger.info(`TRACKING.md atualizado com ${processed} melhoria(s)`);
    } catch (error) {
      ImprovementLogger.error('Erro ao salvar TRACKING.md', error);
      errors += processed;
      processed = 0;
    }
  }

  return { processed, skipped, errors };
}

/**
 * Função principal
 */
function main() {
  console.log('🦊 Auto-Processador de Melhorias Pendentes\n');
  
  const result = processPendingImprovements();
  
  console.log('\n---');
  console.log(`✅ Processados: ${result.processed}`);
  console.log(`⏭️  Pulados: ${result.skipped}`);
  console.log(`❌ Erros: ${result.errors}`);
  
  process.exit(result.errors > 0 ? 1 : 0);
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  findPendingImprovements,
  parseImprovementFile,
  processPendingImprovements,
  generateTrackingEntry
};
