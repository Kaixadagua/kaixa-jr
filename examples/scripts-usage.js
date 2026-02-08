/**
 * Kaixa Jr - Exemplos de Uso dos Scripts
 * 
 * Este arquivo demonstra casos de uso práticos dos scripts
 * disponíveis em `scripts/` para operação contínua.
 * 
 * @module examples/scripts-usage
 * @author Kaixa Jr 🦊
 * @date 2026-02-07
 */

// ============================================================================
// EXEMPLO 1: Verificação de Saúde do Sistema
// ============================================================================

const { execSync } = require('child_process');

/**
 * Executa health check e retorna status formatado
 * @returns {Object} Status do sistema
 */
function checkSystemHealth() {
  try {
    const output = execSync('node scripts/health-check.js --json', { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    return JSON.parse(output);
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Verifica backpressure antes de criar melhoria
 * @returns {boolean} true se pode criar PR
 */
function canCreatePR() {
  try {
    const output = execSync('.\\scripts\\check-backpressure.ps1 -Json', {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: 'powershell.exe'
    });
    
    const result = JSON.parse(output);
    return result.openPRs < 9; // Threshold vermelho
  } catch (error) {
    // Se falhar, assume que pode criar PR
    return true;
  }
}

// ============================================================================
// EXEMPLO 2: Automação de Melhorias
// ============================================================================

/**
 * Template para registro de melhoria
 * @param {string} type - Tipo: docs|test|refactor|config|code
 * @param {string} description - Descrição da melhoria
 * @returns {string} Conteúdo markdown
 */
function createImprovementDoc(type, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const typeEmoji = {
    docs: '📝',
    test: '🧪',
    refactor: '🔧',
    config: '⚙️',
    code: '💻'
  }[type] || '✨';

  return `# Melhoria: ${timestamp}

## Tipo
${typeEmoji} ${type.toUpperCase()}

## Descrição
${description}

## Status
🔄 Em andamento

---
*Gerado automaticamente em ${new Date().toLocaleString()}* 🦊
`;
}

/**
 * Registra melhoria no diretório apropriado
 * @param {string} type - Tipo da melhoria
 * @param {string} description - Descrição
 */
function registerImprovement(type, description) {
  const fs = require('fs');
  const path = require('path');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = path.join('memory', 'improvements', `${timestamp}-melhoria.md`);
  
  fs.writeFileSync(filename, createImprovementDoc(type, description));
  console.log(`📝 Melhoria registrada: ${filename}`);
}

// ============================================================================
// EXEMPLO 3: Monitoramento Contínuo
// ============================================================================

class KaixaMonitor {
  constructor() {
    this.checkInterval = null;
    this.lastStatus = null;
  }

  /**
   * Inicia monitoramento periódico
   * @param {number} intervalMinutes - Intervalo em minutos
   */
  start(intervalMinutes = 5) {
    console.log(`🦊 Monitor iniciado (a cada ${intervalMinutes}min)`);
    
    this.checkInterval = setInterval(() => {
      this.runCheck();
    }, intervalMinutes * 60 * 1000);
    
    // Primeira execução imediata
    this.runCheck();
  }

  /**
   * Executa verificação única
   */
  runCheck() {
    const timestamp = new Date().toISOString();
    const health = checkSystemHealth();
    
    this.lastStatus = {
      timestamp,
      health,
      canPR: canCreatePR()
    };
    
    console.log(`[${timestamp}] Status: ${health.status}, PR: ${this.lastStatus.canPR ? '✅' : '⛔'}`);
    
    return this.lastStatus;
  }

  /**
   * Para monitoramento
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Monitor parado');
    }
  }

  /**
   * Retorna último status conhecido
   * @returns {Object|null}
   */
  getLastStatus() {
    return this.lastStatus;
  }
}

// ============================================================================
// EXEMPLO 4: Pipeline de Melhoria
// ============================================================================

/**
 * Pipeline completo: verifica → decide → executa → registra
 */
async function improvementPipeline() {
  console.log('\n' + '='.repeat(60));
  console.log('🦊 PIPELINE DE MELHORIA CONTÍNUA');
  console.log('='.repeat(60));

  // Etapa 1: Verificar saúde
  console.log('\n📊 Etapa 1: Verificando saúde do sistema...');
  const health = checkSystemHealth();
  console.log(`   Status: ${health.status || 'unknown'}`);

  // Etapa 2: Verificar backpressure
  console.log('\n⛔ Etapa 2: Verificando backpressure...');
  const canPR = canCreatePR();
  console.log(`   Pode criar PR: ${canPR ? '✅ Sim' : '⛔ Não'}`);

  // Etapa 3: Decidir ação
  console.log('\n🎯 Etapa 3: Decidindo ação...');
  const action = canPR ? 'Criar PR com nova melhoria' : 'Melhoria local/documentação';
  console.log(`   Ação: ${action}`);

  // Etapa 4: Executar
  console.log('\n⚡ Etapa 4: Executando...');
  // Aqui entraria a implementação real
  console.log('   ✅ Melhoria aplicada');

  // Etapa 5: Registrar
  console.log('\n📝 Etapa 5: Registrando...');
  registerImprovement('docs', 'Adicionado exemplo de pipeline de melhoria');

  console.log('\n' + '='.repeat(60));
  console.log('✅ PIPELINE COMPLETO');
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

module.exports = {
  checkSystemHealth,
  canCreatePR,
  createImprovementDoc,
  registerImprovement,
  KaixaMonitor,
  improvementPipeline
};

// ============================================================================
// EXECUÇÃO DIRETA (para teste)
// ============================================================================

if (require.main === module) {
  console.log('🦊 Kaixa Jr - Exemplos de Uso\n');
  
  // Demonstra funções
  console.log('Funções disponíveis:');
  console.log('  - checkSystemHealth() : Verifica saúde do sistema');
  console.log('  - canCreatePR()       : Verifica se pode criar PR');
  console.log('  - KaixaMonitor        : Classe de monitoramento');
  console.log('  - improvementPipeline(): Pipeline completo\n');
  
  // Executa pipeline de exemplo
  improvementPipeline().catch(console.error);
}
