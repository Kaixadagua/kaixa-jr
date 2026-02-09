#!/usr/bin/env node
/**
 * @fileoverview Git Safe Operations - Wrapper seguro para comandos git
 * @description Executa operações git com retry, fallback e logging detalhado
 * @module scripts/git-safe
 * @author Kaixa Jr 🦊
 * @since 2026-02-09
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  logDir: 'memory/logs',
  timeoutMs: 30000
};

// =============================================================================
// LOGGER
// =============================================================================

class GitLogger {
  constructor() {
    this.logs = [];
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
  }

  log(level, operation, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      ...details
    };
    this.logs.push(entry);
    
    const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : 'ℹ️';
    console.log(`${icon} [${level}] ${operation}${details.message ? ': ' + details.message : ''}`);
  }

  info(op, details) { this.log('INFO', op, details); }
  success(op, details) { this.log('SUCCESS', op, details); }
  warn(op, details) { this.log('WARN', op, details); }
  error(op, details) { this.log('ERROR', op, details); }

  saveLog() {
    const filename = `git-operations-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(CONFIG.logDir, filename);
    
    let existing = [];
    if (fs.existsSync(filepath)) {
      existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    
    existing.push(...this.logs);
    fs.writeFileSync(filepath, JSON.stringify(existing, null, 2));
  }
}

// =============================================================================
// EXECUTOR SEGURO
// =============================================================================

class SafeExecutor {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Executa comando com retry automático
   * @param {string} cmd - Comando a executar
   * @param {Object} options - Opções adicionais
   * @returns {{success: boolean, output: string, error?: string}}
   */
  execute(cmd, options = {}) {
    const { 
      ignoreError = false, 
      timeout = CONFIG.timeoutMs,
      retries = CONFIG.maxRetries 
    } = options;

    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.info('EXECUTE', { cmd, attempt, maxRetries: retries });
        
        const output = execSync(cmd, {
          encoding: 'utf8',
          timeout,
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        
        this.logger.success('EXECUTE', { cmd, attempt, output: output.slice(0, 100) });
        return { success: true, output };
        
      } catch (error) {
        lastError = error;
        const errorMsg = error.message || 'Unknown error';
        
        if (attempt < retries) {
          this.logger.warn('EXECUTE_RETRY', { 
            cmd, 
            attempt, 
            error: errorMsg.slice(0, 100),
            nextAttempt: attempt + 1 
          });
          
          // Delay antes de retry
          const delay = CONFIG.retryDelayMs * attempt;
          this.sleep(delay);
        } else {
          this.logger.error('EXECUTE_FAIL', { 
            cmd, 
            attempts: retries, 
            error: errorMsg.slice(0, 200) 
          });
        }
      }
    }

    if (!ignoreError) {
      return { 
        success: false, 
        output: '', 
        error: lastError?.message || 'Execution failed' 
      };
    }

    return { success: false, output: '', error: null };
  }

  sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy wait para simplicidade em scripts
    }
  }
}

// =============================================================================
// OPERAÇÕES GIT
// =============================================================================

class GitOperations {
  constructor(executor, logger) {
    this.executor = executor;
    this.logger = logger;
  }

  // ---------------------------------------------------------------------------
  // Status & Info
  // ---------------------------------------------------------------------------

  status() {
    const result = this.executor.execute('git status --porcelain');
    if (result.success) {
      const files = result.output.split('\n').filter(Boolean);
      this.logger.success('STATUS', { filesChanged: files.length });
      return { clean: files.length === 0, files };
    }
    return { clean: true, files: [], error: result.error };
  }

  currentBranch() {
    const result = this.executor.execute('git branch --show-current');
    if (result.success) {
      return { success: true, branch: result.output };
    }
    return { success: false, branch: null, error: result.error };
  }

  lastCommit() {
    const result = this.executor.execute('git log -1 --oneline');
    if (result.success) {
      const [hash, ...msgParts] = result.output.split(' ');
      return { success: true, hash, message: msgParts.join(' ') };
    }
    return { success: false, error: result.error };
  }

  // ---------------------------------------------------------------------------
  // Branches
  // ---------------------------------------------------------------------------

  createBranch(name) {
    const result = this.executor.execute(`git checkout -b ${name}`);
    if (result.success) {
      this.logger.success('BRANCH_CREATE', { branch: name });
      return { success: true, branch: name };
    }
    return { success: false, error: result.error };
  }

  checkout(branch) {
    const result = this.executor.execute(`git checkout ${branch}`);
    if (result.success) {
      this.logger.success('CHECKOUT', { branch });
      return { success: true, branch };
    }
    return { success: false, error: result.error };
  }

  deleteBranch(name, force = false) {
    const flag = force ? '-D' : '-d';
    const result = this.executor.execute(`git branch ${flag} ${name}`, { ignoreError: true });
    if (result.success) {
      this.logger.success('BRANCH_DELETE', { branch: name, force });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  listBranches() {
    const result = this.executor.execute('git branch -a');
    if (result.success) {
      const branches = result.output.split('\n').map(b => b.trim().replace(/^\*\s*/, ''));
      return { success: true, branches };
    }
    return { success: false, error: result.error };
  }

  // ---------------------------------------------------------------------------
  // Commits
  // ---------------------------------------------------------------------------

  add(files = '.') {
    const result = this.executor.execute(`git add ${files}`);
    if (result.success) {
      this.logger.success('ADD', { files });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  commit(message) {
    // Escapa aspas na mensagem
    const safeMessage = message.replace(/"/g, '\\"');
    const result = this.executor.execute(`git commit -m "${safeMessage}"`);
    if (result.success) {
      this.logger.success('COMMIT', { message: message.slice(0, 50) });
      return { success: true, message };
    }
    return { success: false, error: result.error };
  }

  amend(message = null) {
    const cmd = message 
      ? `git commit --amend -m "${message.replace(/"/g, '\\"')}"`
      : 'git commit --amend --no-edit';
    
    const result = this.executor.execute(cmd);
    if (result.success) {
      this.logger.success('AMEND', { message: message?.slice(0, 50) });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  // ---------------------------------------------------------------------------
  // Remote
  // ---------------------------------------------------------------------------

  push(branch, options = {}) {
    const { force = false, setUpstream = true } = options;
    let cmd = 'git push';
    
    if (setUpstream) cmd += ` -u origin ${branch}`;
    else cmd += ` origin ${branch}`;
    
    if (force) cmd += ' --force-with-lease';
    
    const result = this.executor.execute(cmd);
    if (result.success) {
      this.logger.success('PUSH', { branch, force, setUpstream });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  pull(branch = null) {
    const cmd = branch ? `git pull origin ${branch}` : 'git pull';
    const result = this.executor.execute(cmd);
    if (result.success) {
      this.logger.success('PULL', { branch });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  fetch() {
    const result = this.executor.execute('git fetch --all');
    if (result.success) {
      this.logger.success('FETCH');
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  // ---------------------------------------------------------------------------
  // Stash
  // ---------------------------------------------------------------------------

  stash(message = null) {
    const cmd = message ? `git stash push -m "${message.replace(/"/g, '\\"')}"` : 'git stash';
    const result = this.executor.execute(cmd);
    if (result.success) {
      this.logger.success('STASH', { message: message?.slice(0, 50) });
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  stashPop() {
    const result = this.executor.execute('git stash pop');
    if (result.success) {
      this.logger.success('STASH_POP');
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  stashList() {
    const result = this.executor.execute('git stash list');
    if (result.success) {
      const stashes = result.output.split('\n').filter(Boolean);
      return { success: true, count: stashes.length, stashes };
    }
    return { success: false, error: result.error };
  }
}

// =============================================================================
// WORKFLOWS COMUNS
// =============================================================================

class GitWorkflows {
  constructor(git) {
    this.git = git;
  }

  /**
   * Workflow: Criar feature branch, commit e push
   */
  featureCommit(branchName, commitMessage, files = '.') {
    const current = this.git.currentBranch();
    if (!current.success) return { success: false, error: 'Cannot get current branch' };

    const originalBranch = current.branch;
    
    // Criar branch
    const branch = this.git.createBranch(branchName);
    if (!branch.success) {
      // Se falhou, talvez já exista - tenta checkout
      const checkout = this.git.checkout(branchName);
      if (!checkout.success) {
        return { success: false, error: 'Cannot create or checkout branch' };
      }
    }

    // Add e commit
    const add = this.git.add(files);
    if (!add.success) {
      this.git.checkout(originalBranch);
      return { success: false, error: 'Cannot stage files' };
    }

    const commit = this.git.commit(commitMessage);
    if (!commit.success) {
      this.git.checkout(originalBranch);
      return { success: false, error: 'Cannot commit' };
    }

    // Push
    const push = this.git.push(branchName);
    if (!push.success) {
      this.git.checkout(originalBranch);
      return { success: false, error: 'Cannot push' };
    }

    // Voltar para branch original
    this.git.checkout(originalBranch);

    return { 
      success: true, 
      branch: branchName, 
      commit: commitMessage,
      originalBranch 
    };
  }

  /**
   * Workflow: Safe pull com stash automático
   */
  safePull(branch = null) {
    const status = this.git.status();
    let stashed = false;

    if (!status.clean) {
      const stash = this.git.stash('auto-stash-before-pull');
      if (stash.success) stashed = true;
    }

    const pull = this.git.pull(branch);
    
    if (stashed && pull.success) {
      this.git.stashPop();
    }

    return { success: pull.success, stashed, error: pull.error };
  }

  /**
   * Workflow: Reset para estado limpo
   */
  hardReset(target = 'HEAD') {
    this.git.executor.execute('git reset --hard ' + target, { ignoreError: true });
    this.git.executor.execute('git clean -fd', { ignoreError: true });
    return { success: true, target };
  }
}

// =============================================================================
// CLI
// =============================================================================

function showHelp() {
  console.log(`
🦊 Git Safe Operations - Wrapper seguro para comandos git

Uso: node scripts/git-safe.js <comando> [args]

Comandos:
  status                    Verificar status do repositório
  branch                    Mostrar branch atual
  branches                  Listar todas as branches
  create-branch <nome>      Criar nova branch
  checkout <nome>           Mudar para branch
  add [arquivos]            Adicionar arquivos (padrão: .)
  commit <mensagem>         Criar commit
  push [branch]             Push para origin
  pull [branch]             Pull da origin
  fetch                     Fetch de todos os remotes
  stash [mensagem]          Criar stash
  stash-pop                 Aplicar último stash
  stash-list                Listar stashes
  feature <branch> <msg>    Workflow: criar branch, commit, push
  safe-pull                 Pull com stash automático
  hard-reset [target]       Reset hard para target (padrão: HEAD)
  
Exemplos:
  node scripts/git-safe.js status
  node scripts/git-safe.js create-branch feature/nova-func
  node scripts/git-safe.js commit "Minha mensagem"
  node scripts/git-safe.js feature feature/x "feat: nova funcionalidade"
`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  const logger = new GitLogger();
  const executor = new SafeExecutor(logger);
  const git = new GitOperations(executor, logger);
  const workflows = new GitWorkflows(git);

  let result;

  switch (command) {
    case 'status':
      result = git.status();
      console.log('\n📊 Status:', result.clean ? '✅ Clean' : '⚠️ Modified');
      if (result.files.length > 0) {
        console.log('📁 Files:', result.files.slice(0, 10).join(', '));
        if (result.files.length > 10) console.log(`... e mais ${result.files.length - 10} arquivos`);
      }
      break;

    case 'branch':
      result = git.currentBranch();
      console.log(result.success ? `🌿 ${result.branch}` : `❌ ${result.error}`);
      break;

    case 'branches':
      result = git.listBranches();
      if (result.success) {
        console.log('\n🌿 Branches:');
        result.branches.forEach(b => console.log(`  ${b}`));
      }
      break;

    case 'create-branch':
      result = git.createBranch(args[1]);
      console.log(result.success ? `✅ Branch criada: ${args[1]}` : `❌ ${result.error}`);
      break;

    case 'checkout':
      result = git.checkout(args[1]);
      console.log(result.success ? `✅ Checkout: ${args[1]}` : `❌ ${result.error}`);
      break;

    case 'add':
      result = git.add(args[1] || '.');
      console.log(result.success ? '✅ Staged' : `❌ ${result.error}`);
      break;

    case 'commit':
      result = git.commit(args.slice(1).join(' '));
      console.log(result.success ? `✅ Commit: ${result.commit?.message}` : `❌ ${result.error}`);
      break;

    case 'push':
      result = git.push(args[1] || 'HEAD');
      console.log(result.success ? '✅ Pushed' : `❌ ${result.error}`);
      break;

    case 'pull':
      result = git.pull(args[1]);
      console.log(result.success ? '✅ Pulled' : `❌ ${result.error}`);
      break;

    case 'fetch':
      result = git.fetch();
      console.log(result.success ? '✅ Fetched' : `❌ ${result.error}`);
      break;

    case 'stash':
      result = git.stash(args.slice(1).join(' '));
      console.log(result.success ? '✅ Stashed' : `❌ ${result.error}`);
      break;

    case 'stash-pop':
      result = git.stashPop();
      console.log(result.success ? '✅ Stash applied' : `❌ ${result.error}`);
      break;

    case 'stash-list':
      result = git.stashList();
      console.log(result.success ? `📦 ${result.count} stashes` : `❌ ${result.error}`);
      if (result.success && result.stashes.length > 0) {
        result.stashes.forEach(s => console.log(`  ${s}`));
      }
      break;

    case 'feature':
      result = workflows.featureCommit(args[1], args.slice(2).join(' '));
      console.log(result.success 
        ? `✅ Feature criada: ${result.branch}` 
        : `❌ ${result.error}`);
      break;

    case 'safe-pull':
      result = workflows.safePull(args[1]);
      console.log(result.success 
        ? `✅ Pulled${result.stashed ? ' (com stash)' : ''}` 
        : `❌ ${result.error}`);
      break;

    case 'hard-reset':
      result = workflows.hardReset(args[1]);
      console.log(result.success ? `✅ Reset to ${result.target}` : `❌ Failed`);
      break;

    default:
      console.log(`❌ Comando desconhecido: ${command}`);
      showHelp();
      process.exit(1);
  }

  // Salvar logs
  logger.saveLog();
  
  process.exit(result?.success ? 0 : 1);
}

// Exportar para uso como módulo
module.exports = { 
  GitOperations, 
  GitWorkflows, 
  SafeExecutor, 
  GitLogger,
  CONFIG 
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}
