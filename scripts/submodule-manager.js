#!/usr/bin/env node
/**
 * @fileoverview Submódulo Manager - Gestão inteligente de submódulos git
 * @description Verifica, sincroniza e mantém submódulos em estado saudável
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/submodule-manager.js [--fix|-f] [--status|-s]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Configuração do Manager
 * @constant {Object}
 */
const CONFIG = {
    submodules: ['aurahub'],
    fixMode: process.argv.includes('--fix') || process.argv.includes('-f'),
    statusOnly: process.argv.includes('--status') || process.argv.includes('-s')
};

/**
 * Executa comando git de forma segura
 * @param {string} cmd - Comando a executar
 * @param {string} cwd - Diretório de trabalho
 * @returns {string} Output do comando
 */
function git(cmd, cwd = process.cwd()) {
    try {
        return execSync(cmd, { 
            cwd, 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    } catch (e) {
        return e.stderr || e.stdout || '';
    }
}

/**
 * Verifica estado de um submódulo
 * @param {string} name - Nome do submódulo
 * @returns {Object} Estado do submódulo
 */
function checkSubmodule(name) {
    const submodulePath = path.join(process.cwd(), name);
    
    // Verificar se existe
    if (!fs.existsSync(submodulePath)) {
        return { name, exists: false, status: 'missing' };
    }
    
    // Verificar estado do git no submódulo
    const status = git('git status --porcelain', submodulePath);
    const branch = git('git branch --show-current', submodulePath) || 'detached';
    const commit = git('git rev-parse --short HEAD', submodulePath);
    const originUrl = git('git remote get-url origin', submodulePath);
    
    const isDirty = status.length > 0;
    const hasUnpushed = git('git log origin/' + branch + '..HEAD --oneline', submodulePath).length > 0;
    
    return {
        name,
        exists: true,
        path: submodulePath,
        branch,
        commit: commit.slice(0, 7),
        originUrl,
        isDirty,
        hasUnpushed,
        status: isDirty ? 'dirty' : hasUnpushed ? 'unpushed' : 'clean',
        changes: status.split('\n').filter(l => l.trim()).length
    };
}

/**
 * Tenta resolver estado dirty de um submódulo
 * @param {Object} submodule - Dados do submódulo
 * @returns {Object} Resultado da operação
 */
function fixSubmodule(submodule) {
    const results = [];
    
    try {
        // Verificar se há mudanças staged/unstaged
        const status = git('git status --porcelain', submodule.path);
        
        if (status.includes(' M ') || status.includes('M  ') || status.includes('?? ')) {
            // Stash das mudanças locais
            git('git stash push -m "Auto-stash by submodule-manager"', submodule.path);
            results.push('stashed');
        }
        
        // Reset para o commit esperado pelo parent
        git('git checkout .', submodule.path);
        git('git clean -fd', submodule.path);
        
        // Atualizar para o commit registrado no parent
        const expectedCommit = git('git ls-tree HEAD ' + submodule.name + ' | awk \'{print $3}\'');
        if (expectedCommit) {
            git(`git checkout ${expectedCommit}`, submodule.path);
            results.push('reset-to-expected');
        }
        
        return { success: true, actions: results };
    } catch (e) {
        return { success: false, error: e.message, actions: results };
    }
}

/**
 * Exibe relatório visual do estado
 * @param {Object[]} submodules - Lista de estados
 */
function printReport(submodules) {
    console.log('\n🦊 Submódulo Manager\n');
    console.log('─'.repeat(60));
    
    submodules.forEach(sm => {
        const icon = {
            clean: '✅',
            dirty: '⚠️',
            unpushed: '📤',
            missing: '❌'
        }[sm.status] || '❓';
        
        console.log(`${icon} ${sm.name}`);
        
        if (!sm.exists) {
            console.log('   Status: NÃO ENCONTRADO');
            return;
        }
        
        console.log(`   Branch: ${sm.branch}`);
        console.log(`   Commit: ${sm.commit}`);
        console.log(`   Status: ${sm.status.toUpperCase()}`);
        
        if (sm.isDirty) {
            console.log(`   ⚠️  ${sm.changes} arquivo(s) modificado(s)`);
        }
        
        if (sm.hasUnpushed) {
            console.log('   📤 Commits não pushados');
        }
    });
    
    console.log('─'.repeat(60));
    
    // Resumo
    const dirty = submodules.filter(s => s.isDirty).length;
    const clean = submodules.filter(s => s.status === 'clean').length;
    
    console.log(`\nResumo: ${clean} limpo(s), ${dirty} sujo(s)`);
    
    if (dirty > 0 && !CONFIG.fixMode) {
        console.log('\n💡 Use --fix para tentar resolver automaticamente');
    }
    
    console.log();
}

/**
 * Função principal
 */
function main() {
    console.log('🔍 Verificando submódulos...\n');
    
    const results = CONFIG.submodules.map(checkSubmodule);
    
    if (CONFIG.statusOnly) {
        // Saída JSON para uso em scripts
        console.log(JSON.stringify(results, null, 2));
        return;
    }
    
    printReport(results);
    
    // Modo fix
    if (CONFIG.fixMode) {
        const dirty = results.filter(r => r.isDirty);
        
        if (dirty.length === 0) {
            console.log('✅ Nenhum submódulo para corrigir\n');
            return;
        }
        
        console.log('🔧 Corrigindo submódulos...\n');
        
        dirty.forEach(sm => {
            console.log(`→ ${sm.name}...`);
            const result = fixSubmodule(sm);
            
            if (result.success) {
                console.log(`  ✅ Corrigido: ${result.actions.join(', ')}`);
            } else {
                console.log(`  ❌ Falha: ${result.error}`);
            }
        });
        
        console.log('\n✅ Processo de correção finalizado\n');
    }
}

main();
