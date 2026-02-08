#!/usr/bin/env node
/**
 * @fileoverview Kaixa CLI - Interface unificada de comandos
 * @description CLI centralizada para acessar todas as ferramentas do ecossistema
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/kaixa-cli.js <comando> [args]
 * @example node scripts/kaixa-cli.js status
 * @example node scripts/kaixa-cli.js improve --list
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} Command
 * @property {string} name - Nome do comando
 * @property {string} description - Descrição curta
 * @property {string} script - Script a ser executado
 * @property {string[]} [aliases] - Apelidos alternativos
 */

/**
 * Registro central de comandos disponíveis
 * @constant {Command[]}
 */
const COMMANDS = [
    {
        name: 'status',
        description: 'Status rápido do sistema (git, backpressure, health)',
        script: 'status.bat',
        aliases: ['s', 'st']
    },
    {
        name: 'health',
        description: 'Health check completo com métricas',
        script: 'scripts/health-check.js',
        aliases: ['h', 'check']
    },
    {
        name: 'guardian',
        description: 'Executar Kaixa Guardian (gestão de saúde)',
        script: 'scripts/kaixa-guardian.js',
        aliases: ['g', 'watch']
    },
    {
        name: 'improve',
        description: 'Dashboard de melhorias (--list, --status)',
        script: 'scripts/melhoria-status.js',
        aliases: ['i', 'imp']
    },
    {
        name: 'backpressure',
        description: 'Verificar status de backpressure de PRs',
        script: 'scripts/check-backpressure.js',
        aliases: ['bp', 'prs']
    },
    {
        name: 'queue',
        description: 'Fila automática de PRs (--status, --force)',
        script: 'scripts/pr-auto-queue.js',
        aliases: ['q', 'auto-queue']
    },
    {
        name: 'quickview',
        description: 'Visualização rápida das últimas melhorias',
        script: 'scripts/improvement-quickview.js',
        aliases: ['qv', 'view']
    },
    {
        name: 'cleanup',
        description: 'Limpeza de arquivos antigos',
        script: 'scripts/system-cleanup.js',
        aliases: ['clean', 'c']
    },
    {
        name: 'submodule',
        description: 'Gestão de submódulos (--status, --fix)',
        script: 'scripts/submodule-manager.js',
        aliases: ['sub', 'sm']
    },
    {
        name: 'index',
        description: 'Índice interativo de scripts',
        script: 'scripts/scripts-index.js',
        aliases: ['idx', 'scripts']
    }
];

/**
 * Exibe banner estilizado do Kaixa CLI
 */
function showBanner() {
    console.log('\n🦊 Kaixa CLI - Interface Unificada\n');
}

/**
 * Exibe ajuda/usage do CLI
 */
function showHelp() {
    showBanner();
    console.log('Uso: node scripts/kaixa-cli.js <comando> [args]\n');
    console.log('Comandos disponíveis:');
    console.log('─'.repeat(60));
    
    COMMANDS.forEach(cmd => {
        const aliasStr = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
        console.log(`  ${cmd.name.padEnd(12)} ${aliasStr.padEnd(15)} ${cmd.description}`);
    });
    
    console.log('─'.repeat(60));
    console.log('\nExemplos:');
    console.log('  node scripts/kaixa-cli.js status');
    console.log('  node scripts/kaixa-cli.js improve --list');
    console.log('  node scripts/kaixa-cli.js bp --json');
    console.log();
}

/**
 * Resolve comando pelo nome ou alias
 * @param {string} input - Input do usuário
 * @returns {Command|null} Comando encontrado ou null
 */
function resolveCommand(input) {
    return COMMANDS.find(cmd => 
        cmd.name === input || 
        (cmd.aliases && cmd.aliases.includes(input))
    ) || null;
}

/**
 * Executa o script correspondente ao comando
 * @param {Command} command - Comando a executar
 * @param {string[]} args - Argumentos adicionais
 */
function executeCommand(command, args) {
    const scriptPath = path.join(process.cwd(), command.script);
    
    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script não encontrado: ${command.script}`);
        process.exit(1);
    }
    
    const isBatch = command.script.endsWith('.bat');
    const cmd = isBatch 
        ? `call "${scriptPath}" ${args.join(' ')}`
        : `node "${scriptPath}" ${args.join(' ')}`;
    
    try {
        execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    } catch (error) {
        // Erro já exibido pelo script filho
        process.exit(error.status || 1);
    }
}

/**
 * Função principal
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    
    const commandName = args[0];
    const commandArgs = args.slice(1);
    
    const command = resolveCommand(commandName);
    
    if (!command) {
        console.error(`❌ Comando desconhecido: "${commandName}"`);
        console.log('\nComandos disponíveis:');
        COMMANDS.forEach(cmd => console.log(`  - ${cmd.name}`));
        console.log('\nUse --help para mais informações.');
        process.exit(1);
    }
    
    executeCommand(command, commandArgs);
}

main();
