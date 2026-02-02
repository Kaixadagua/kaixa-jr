#!/usr/bin/env node
// setup-agentcorp.js - Setup do repositório AgentCorp
// Última atualização: 2026-02-02

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_DIR = 'C:\\Users\\joaov\\github';
const AGENTCORP_DIR = path.join(GITHUB_DIR, 'AgentCorp');
const REPO_URL = 'https://github.com/AgentCorp/AgentCorp.git';

function run(cmd, cwd) {
    try {
        return execSync(cmd, { encoding: 'utf8', cwd }).trim();
    } catch (e) {
        return null;
    }
}

function setupAgentCorp() {
    console.log('\n🦊 Setup AgentCorp\n');
    console.log('─'.repeat(50));
    
    // Verificar se diretório github existe
    if (!fs.existsSync(GITHUB_DIR)) {
        console.log('📁 Criando diretório github...');
        fs.mkdirSync(GITHUB_DIR, { recursive: true });
    }
    
    // Verificar se já existe
    if (fs.existsSync(AGENTCORP_DIR)) {
        console.log('✅ AgentCorp já existe');
        
        // Verificar branch atual
        const branch = run('git branch --show-current', AGENTCORP_DIR);
        console.log(`📂 Branch atual: ${branch}`);
        
        // Verificar se dev-kaixa existe
        const branches = run('git branch -a', AGENTCORP_DIR);
        if (branches && branches.includes('dev-kaixa')) {
            console.log('✅ Branch dev-kaixa existe');
        } else {
            console.log('⚠️  Branch dev-kaixa não existe');
            console.log('   Criar: git checkout -b dev-kaixa');
        }
    } else {
        console.log('⚠️  AgentCorp não encontrado');
        console.log(`   Clonar: git clone ${REPO_URL}`);
        console.log('   Ou aguardar acesso ao repositório');
    }
    
    console.log('─'.repeat(50));
    console.log('\n💡 Workflow:');
    console.log('   1. git checkout -b feature/xyz dev-kaixa');
    console.log('   2. Implementar');
    console.log('   3. git push origin feature/xyz');
    console.log('   4. Merge para dev-kaixa');
    console.log();
}

setupAgentCorp();
