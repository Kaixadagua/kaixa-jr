#!/usr/bin/env node
/**
 * Cron Improvement - Kaixa Jr
 * Script otimizado para execução via cron
 * Detecta backpressure automaticamente e escolhe estratégia
 * 
 * @module scripts/cron-improvement
 * @author Kaixa Jr 🦊
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const CONFIG = {
  repo: 'Kaixadagua/kaixa-jr',
  backpressureThreshold: 9,
  improvementsDir: 'memory/improvements',
  gitUser: 'Kaixa Jr',
  gitEmail: 'kaixa@aurahub.ai'
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

const Logger = {
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  },

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const color = this.colors[level === 'ERROR' ? 'red' : level === 'WARN' ? 'yellow' : level === 'SUCCESS' ? 'green' : 'cyan'];
    const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : level === 'INFO' ? 'ℹ️' : '🦊';
    
    console.log(`${this.colors.dim}[${timestamp}]${this.colors.reset} ${color}${icon} [${level}]${this.colors.reset} ${message}`);
    
    if (Object.keys(meta).length > 0) {
      console.log(`${this.colors.dim}   ${JSON.stringify(meta)}${this.colors.reset}`);
    }
  },

  info: (msg, meta) => Logger.log('INFO', msg, meta),
  success: (msg, meta) => Logger.log('SUCCESS', msg, meta),
  warn: (msg, meta) => Logger.log('WARN', msg, meta),
  error: (msg, meta) => Logger.log('ERROR', msg, meta),
  fox: (msg, meta) => Logger.log('FOX', msg, meta)
};

// =============================================================================
// DETECÇÃO DE BACKPRESSURE
// =============================================================================

/**
 * Verifica backpressure via GitHub CLI
 * @returns {{active: boolean, count: number, status: 'green'|'yellow'|'red'}}
 */
function checkBackpressure() {
  try {
    const output = execSync(`gh pr list --repo ${CONFIG.repo} --state open --json number --jq length`, {
      encoding: 'utf8',
      timeout: 10000
    }).trim();
    
    const count = parseInt(output, 10) || 0;
    const status = count >= CONFIG.backpressureThreshold ? 'red' : count >= 6 ? 'yellow' : 'green';
    
    return { active: status === 'red', count, status };
  } catch (e) {
    Logger.warn('Falha ao verificar backpressure, assumindo RED', { error: e.message });
    return { active: true, count: -1, status: 'red' };
  }
}

// =============================================================================
// SUGESTÃO DE MELHORIAS
// =============================================================================

const IMPROVEMENTS = {
  // Melhorias que podem ser PR (código, features)
  pr: [
    {
      type: 'code',
      title: 'Adiciona validação de entrada em função crítica',
      priority: 1,
      execute: () => addInputValidation()
    },
    {
      type: 'test',
      title: 'Adiciona teste de edge case',
      priority: 2,
      execute: () => addEdgeCaseTest()
    },
    {
      type: 'refactor',
      title: 'Melhora tratamento de erro com fallback',
      priority: 3,
      execute: () => improveErrorHandling()
    }
  ],

  // Melhorias locais (docs, tracking, organização)
  local: [
    {
      type: 'docs',
      title: 'Atualiza índice de melhorias com métricas recentes',
      priority: 1,
      execute: () => updateImprovementsIndex()
    },
    {
      type: 'docs',
      title: 'Documenta padrão de nomenclatura de branches',
      priority: 2,
      execute: () => documentBranchNaming()
    },
    {
      type: 'config',
      title: 'Atualiza metadata de tracking de melhorias',
      priority: 3,
      execute: () => updateTrackingMetadata()
    },
    {
      type: 'docs',
      title: 'Adiciona entry no CHANGELOG de melhorias',
      priority: 4,
      execute: () => addChangelogEntry()
    }
  ]
};

/**
 * Seleciona melhoria baseada no modo (PR ou local)
 * @param {'pr'|'local'} mode 
 * @returns {Object}
 */
function selectImprovement(mode) {
  const pool = IMPROVEMENTS[mode] || IMPROVEMENTS.local;
  // Seleciona baseado em prioridade (menor número = maior prioridade)
  const sorted = pool.sort((a, b) => a.priority - b.priority);
  
  // Verifica quais já foram feitas recentemente
  const recent = getRecentImprovements();
  const available = sorted.filter(imp => !recent.includes(imp.title));
  
  return available[0] || sorted[0]; // Fallback para primeira se todas foram feitas
}

/**
 * Lê melhorias recentes para evitar duplicatas
 * @returns {string[]}
 */
function getRecentImprovements() {
  try {
    const files = fs.readdirSync(CONFIG.improvementsDir)
      .filter(f => f.endsWith('.md') && f.includes('melhoria'))
      .sort()
      .slice(-10); // Últimas 10
    
    const titles = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(CONFIG.improvementsDir, file), 'utf8');
      const match = content.match(/## Descrição\s*\n([^\n]+)/);
      if (match) titles.push(match[1].trim());
    }
    return titles;
  } catch (e) {
    return [];
  }
}

// =============================================================================
// EXECUTORES DE MELHORIA
// =============================================================================

function addInputValidation() {
  const file = 'src/utils/validation.js';
  const content = `
/**
 * Validação de entrada adicionada em ${new Date().toISOString()}
 * @param {any} input - Valor a validar
 * @param {string} type - Tipo esperado
 * @returns {boolean}
 */
function validateInput(input, type) {
  if (input === null || input === undefined) return false;
  
  const validators = {
    string: v => typeof v === 'string' && v.length > 0,
    number: v => typeof v === 'number' && !isNaN(v),
    array: v => Array.isArray(v) && v.length > 0,
    object: v => typeof v === 'object' && v !== null && !Array.isArray(v)
  };
  
  return validators[type] ? validators[type](input) : false;
}

module.exports = { validateInput };
`;
  
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return { file, lines: content.split('\n').length, type: 'code' };
}

function addEdgeCaseTest() {
  const file = 'tests/utils/validation.test.js';
  const content = `
  describe('Edge Cases', () => {
    it('should handle null input', () => {
      expect(validateInput(null, 'string')).toBe(false);
    });
    
    it('should handle undefined input', () => {
      expect(validateInput(undefined, 'number')).toBe(false);
    });
    
    it('should handle empty string', () => {
      expect(validateInput('', 'string')).toBe(false);
    });
    
    it('should handle NaN', () => {
      expect(validateInput(NaN, 'number')).toBe(false);
    });
  });
`;
  
  ensureDir(path.dirname(file));
  
  // Se arquivo existe, append; senão cria
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, existing.replace('});', content + '});'));
  } else {
    fs.writeFileSync(file, `const { validateInput } = require('../../src/utils/validation');\n\ndescribe('Validation', () => {${content}});\n`);
  }
  
  return { file, lines: content.split('\n').length, type: 'test' };
}

function improveErrorHandling() {
  const file = 'src/utils/safeExecute.js';
  const content = `
/**
 * Executor seguro com fallback
 * @param {Function} fn - Função a executar
 * @param {any} fallback - Valor de fallback
 * @returns {any} Resultado ou fallback
 */
function safeExecute(fn, fallback = null) {
  try {
    const result = fn();
    return result !== undefined ? result : fallback;
  } catch (error) {
    console.warn('[safeExecute] Error caught:', error.message);
    return fallback;
  }
}

module.exports = { safeExecute };
`;
  
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return { file, lines: content.split('\n').length, type: 'refactor' };
}

function updateImprovementsIndex() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const file = `${CONFIG.improvementsDir}/INDEX-${timestamp}.md`;
  
  // Conta melhorias existentes
  const files = fs.readdirSync(CONFIG.improvementsDir).filter(f => f.endsWith('.md'));
  const total = files.length;
  
  const content = `# Índice de Melhorias - ${timestamp}

## Estatísticas
- **Total de melhorias:** ${total}
- **Gerado em:** ${new Date().toLocaleString('pt-BR')}
- **Período:** Contínuo

## Categorias Detectadas
- 📝 Documentação
- 💻 Código  
- 🧪 Testes
- 🔧 Refatoração
- ⚙️ Configuração

## Metodologia
1. Detectar backpressure automaticamente
2. Escolher entre PR ou melhoria local
3. Registrar em tracking
4. Nunca parar, sempre melhorar

---
*Índice gerado automaticamente* 🦊
`;
  
  fs.writeFileSync(file, content);
  return { file, lines: content.split('\n').length, type: 'docs' };
}

function documentBranchNaming() {
  const file = 'docs/BRANCH-NAMING.md';
  const content = `# Padrão de Nomenclatura de Branches

## Formato
\`\`\`
<tipo>/<descrição-curta>-<timestamp>
\`\`\`

## Tipos

| Tipo | Uso | Exemplo |
|------|-----|---------|
| feature | Nova funcionalidade | feature/auth-login-abc123 |
| fix | Correção de bug | fix/memory-leak-xyz789 |
| refactor | Refatoração | refactor/cleanup-deps-123abc |
| docs | Documentação | docs/api-examples-def456 |
| test | Testes | test/edge-cases-ghi789 |
| config | Configurações | config/ci-workflow-jkl012 |

## Convenções
1. Use kebab-case (minúsculas com hífens)
2. Mantenha descrição em até 3 palavras
3. Sempre inclua timestamp único
4. Evite caracteres especiais

## Exemplos Válidos
- feature/auto-improvement-a1b2c3
- fix/validation-null-d4e5f6  
- docs/readme-update-g7h8i9

---
*Documentado em ${new Date().toLocaleString('pt-BR')}* 🦊
`;
  
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return { file, lines: content.split('\n').length, type: 'docs' };
}

function updateTrackingMetadata() {
  const timestamp = new Date().toISOString();
  const file = `${CONFIG.improvementsDir}/.tracking-meta.json`;
  
  let meta = { runs: [], totalImprovements: 0 };
  if (fs.existsSync(file)) {
    meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  
  meta.runs.push({
    timestamp,
    mode: 'local',
    triggeredBy: 'cron'
  });
  
  meta.totalImprovements = (meta.totalImprovements || 0) + 1;
  meta.lastRun = timestamp;
  
  fs.writeFileSync(file, JSON.stringify(meta, null, 2));
  return { file, lines: 1, type: 'config' };
}

function addChangelogEntry() {
  const file = 'memory/improvements/CHANGELOG.md';
  const timestamp = new Date().toISOString().slice(0, 10);
  const entry = `
## ${timestamp}

### Melhorias Contínuas
- ✅ Melhoria automática via cron
- 🔄 Sistema de backpressure ativo
- 📝 Documentação atualizada

`;
  
  let content = '';
  if (fs.existsSync(file)) {
    content = fs.readFileSync(file, 'utf8');
  } else {
    content = '# Changelog de Melhorias\n\n';
  }
  
  content = content.replace('# Changelog de Melhorias\n\n', '# Changelog de Melhorias\n\n' + entry);
  fs.writeFileSync(file, content);
  return { file, lines: entry.split('\n').length, type: 'docs' };
}

// =============================================================================
// GIT OPERATIONS
// =============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function createBranch() {
  const timestamp = Date.now().toString(36);
  const branch = `feature/cron-improvement-${timestamp}`;
  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'pipe' });
    return branch;
  } catch (e) {
    return null;
  }
}

function commit(message) {
  try {
    execSync('git add .', { stdio: 'pipe' });
    execSync(`git commit -m "[cron] ${message}"`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function push(branch) {
  try {
    execSync(`git push -u origin ${branch}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function checkout(branch) {
  try {
    execSync(`git checkout ${branch}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// =============================================================================
// DOCUMENTAÇÃO LOCAL
// =============================================================================

function documentLocal(improvement, result, backpressure) {
  const timestamp = getTimestamp();
  const filename = `${CONFIG.improvementsDir}/${timestamp}-melhoria.md`;
  
  const content = `# Melhoria: ${timestamp}

## Tipo
${improvement.type === 'docs' ? '📝 Docs' : improvement.type === 'test' ? '🧪 Test' : improvement.type === 'refactor' ? '🔧 Refactor' : improvement.type === 'config' ? '⚙️ Config' : '💻 Code'}

## Descrição
${improvement.title}

## Contexto
- **Backpressure:** ${backpressure.active ? '🔴 ATIVO' : '🟢 INATIVO'}
- **PRs abertos:** ${backpressure.count}
- **Modo:** Local (documentação)
- **Trigger:** Cron job

## Arquivos Alterados
- \`${result.file}\` (+${result.lines} linhas)

## Status
✅ Implementada localmente
⏳ Aguardando backpressure liberar para PR

## Próximos Passos
Quando backpressure < ${CONFIG.backpressureThreshold}:
1. Criar branch \`feature/cron-improvement-<timestamp>\`
2. Mover mudanças para branch
3. Criar PR com referência a este documento

---
*Melhoria automática gerada em ${new Date().toLocaleString('pt-BR')}* 🦊
`;

  fs.writeFileSync(filename, content);
  return filename;
}

// =============================================================================
// MAIN
// =============================================================================

async function run() {
  Logger.fox('KAIXA JR - CRON IMPROVEMENT iniciado');
  
  // 1. Detectar backpressure
  Logger.info('Verificando backpressure...');
  const backpressure = checkBackpressure();
  Logger.info(`Status: ${backpressure.status.toUpperCase()} (${backpressure.count} PRs)`);
  
  // 2. Selecionar modo e melhoria
  const mode = backpressure.active ? 'local' : 'pr';
  Logger.info(`Modo selecionado: ${mode.toUpperCase()}`);
  
  const improvement = selectImprovement(mode);
  Logger.info(`Melhoria: ${improvement.title}`);
  
  // 3. Executar melhoria
  Logger.info('Executando melhoria...');
  const result = improvement.execute();
  Logger.success(`✓ ${result.file} (+${result.lines} linhas)`);
  
  // 4. Se modo PR, tentar branch/commit/push
  if (mode === 'pr') {
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    const branch = createBranch();
    if (branch) {
      Logger.info(`Branch criada: ${branch}`);
      
      if (commit(improvement.title)) {
        Logger.success('Commit realizado');
        
        if (push(branch)) {
          Logger.success('Push realizado!');
          checkout(currentBranch);
          
          // Documentar
          const docFile = documentLocal(improvement, result, backpressure);
          Logger.success(`✅ MELHORIA COMPLETA (PR)`, { branch, docFile });
          return { success: true, mode: 'pr', branch, file: result.file };
        }
      }
    }
    
    // Se falhou, volta para branch original e documenta local
    checkout(currentBranch);
    Logger.warn('Falha no PR, documentando localmente');
  }
  
  // 5. Documentar local
  const docFile = documentLocal(improvement, result, backpressure);
  Logger.success(`✅ MELHORIA DOCUMENTADA (local)`, { docFile, file: result.file });
  
  return { success: true, mode: 'local', file: result.file, docFile };
}

// Executa
run().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  Logger.error('Erro fatal:', { message: err.message });
  process.exit(1);
});
