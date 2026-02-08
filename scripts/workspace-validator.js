#!/usr/bin/env node
/**
 * @fileoverview Workspace Validator - Valida consistência da estrutura do projeto
 * @description Verifica diretórios, arquivos essenciais e conformidade de nomenclatura
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/workspace-validator.js [--fix]
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    workspace: 'C:\\Users\\joaov\\.openclaw\\workspace',
    fixMode: process.argv.includes('--fix')
};

/**
 * Estrutura esperada do workspace
 * @constant {Object}
 */
const EXPECTED_STRUCTURE = {
    directories: [
        'docs',
        'memory',
        'memory/improvements',
        'memory/reports', 
        'scripts',
        'scripts/reports',
        'skills',
        'templates'
    ],
    files: [
        'AGENTS.md',
        'HEARTBEAT.md',
        'IDENTITY.md',
        'MEMORY.md',
        'SOUL.md',
        'TOOLS.md',
        'USER.md'
    ]
};

/**
 * Valida se um diretório existe
 * @param {string} dir - Caminho relativo do diretório
 * @returns {Object} { exists: boolean, path: string }
 */
function validateDirectory(dir) {
    const fullPath = path.join(CONFIG.workspace, dir);
    return {
        exists: fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(),
        path: dir,
        fullPath
    };
}

/**
 * Valida se um arquivo existe
 * @param {string} file - Caminho relativo do arquivo
 * @returns {Object} { exists: boolean, path: string }
 */
function validateFile(file) {
    const fullPath = path.join(CONFIG.workspace, file);
    return {
        exists: fs.existsSync(fullPath) && fs.statSync(fullPath).isFile(),
        path: file,
        fullPath
    };
}

/**
 * Valida convenções de nomenclatura em arquivos de melhoria
 * @returns {Object[]} Lista de problemas encontrados
 */
function validateImprovementNaming() {
    const issues = [];
    const impDir = path.join(CONFIG.workspace, 'memory/improvements');
    
    if (!fs.existsSync(impDir)) return issues;
    
    const files = fs.readdirSync(impDir).filter(f => f.endsWith('.md'));
    const validPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?\.md$/;
    
    files.forEach(file => {
        if (file === 'TRACKING.md' || file === 'metrics.json' || 
            file.startsWith('CONSOLIDADO') || file.startsWith('RESUMO')) {
            return; // Arquivos especiais são válidos
        }
        
        // Aceitar formato legado YYYY-MM-DD-HHMM também
        const legacyPattern = /^\d{4}-\d{2}-\d{2}(-\d{4})?-[a-z0-9-]+\.md$/;
        
        if (!validPattern.test(file) && !legacyPattern.test(file)) {
            issues.push({
                type: 'naming',
                file,
                message: `Nome não segue padrão YYYY-MM-DDTHH-MM-SS[-desc].md`
            });
        }
    });
    
    return issues;
}

/**
 * Valida se scripts têm shebang e documentação básica
 * @returns {Object[]} Lista de problemas encontrados
 */
function validateScripts() {
    const issues = [];
    const scriptsDir = path.join(CONFIG.workspace, 'scripts');
    
    if (!fs.existsSync(scriptsDir)) return issues;
    
    const jsFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') && !f.includes('node_modules'));
    
    jsFiles.forEach(file => {
        const fullPath = path.join(scriptsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar shebang
        if (!content.startsWith('#!/usr/bin/env node') && !content.startsWith('/**')) {
            issues.push({
                type: 'documentation',
                file: `scripts/${file}`,
                message: 'Falta shebang (#!/usr/bin/env node) ou JSDoc header'
            });
        }
    });
    
    return issues;
}

/**
 * Valida se skills têm estrutura mínima
 * @returns {Object[]} Lista de problemas encontrados
 */
function validateSkills() {
    const issues = [];
    const skillsDir = path.join(CONFIG.workspace, 'skills');
    
    if (!fs.existsSync(skillsDir)) return issues;
    
    const skills = fs.readdirSync(skillsDir)
        .filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
    
    skills.forEach(skill => {
        const skillPath = path.join(skillsDir, skill);
        const hasReadme = fs.existsSync(path.join(skillPath, 'README.md')) ||
                         fs.existsSync(path.join(skillPath, 'SKILL.md'));
        
        if (!hasReadme) {
            issues.push({
                type: 'structure',
                file: `skills/${skill}/`,
                message: 'Skill sem README.md ou SKILL.md'
            });
        }
    });
    
    return issues;
}

/**
 * Cria diretórios ausentes se em modo --fix
 * @param {Object[]} missingDirs - Lista de diretórios ausentes
 */
function fixMissingDirectories(missingDirs) {
    if (!CONFIG.fixMode) return;
    
    missingDirs.forEach(dir => {
        fs.mkdirSync(dir.fullPath, { recursive: true });
        console.log(`  ✅ Criado: ${dir.path}`);
    });
}

/**
 * Executa todas as validações e exibe relatório
 */
function main() {
    console.log('\n🦊 Workspace Validator\n');
    console.log('═'.repeat(50));
    
    let exitCode = 0;
    
    // 1. Validar diretórios
    console.log('\n📁 Diretórios:');
    const dirResults = EXPECTED_STRUCTURE.directories.map(validateDirectory);
    const missingDirs = dirResults.filter(d => !d.exists);
    
    dirResults.forEach(d => {
        const icon = d.exists ? '✅' : '❌';
        console.log(`   ${icon} ${d.path}`);
    });
    
    if (missingDirs.length > 0) {
        exitCode = 1;
        if (CONFIG.fixMode) {
            console.log('\n🔧 Criando diretórios ausentes...');
            fixMissingDirectories(missingDirs);
        }
    }
    
    // 2. Validar arquivos essenciais
    console.log('\n📄 Arquivos Essenciais:');
    const fileResults = EXPECTED_STRUCTURE.files.map(validateFile);
    const missingFiles = fileResults.filter(f => !f.exists);
    
    fileResults.forEach(f => {
        const icon = f.exists ? '✅' : '⚠️ ';
        console.log(`   ${icon} ${f.path}`);
    });
    
    if (missingFiles.length > 0) {
        console.log(`\n   ⚠️  ${missingFiles.length} arquivo(s) essencial(is) ausente(s)`);
        // Não falha o build por arquivos ausentes, apenas alerta
    }
    
    // 3. Validar nomenclatura de melhorias
    console.log('\n📝 Convenções de Melhorias:');
    const namingIssues = validateImprovementNaming();
    if (namingIssues.length === 0) {
        console.log('   ✅ Todas as melhorias seguem o padrão de nomenclatura');
    } else {
        console.log(`   ⚠️  ${namingIssues.length} problema(s) de nomenclatura:`);
        namingIssues.forEach(issue => {
            console.log(`      - ${issue.file}: ${issue.message}`);
        });
    }
    
    // 4. Validar scripts
    console.log('\n📜 Scripts:');
    const scriptIssues = validateScripts();
    if (scriptIssues.length === 0) {
        console.log('   ✅ Todos os scripts têm documentação adequada');
    } else {
        console.log(`   ⚠️  ${scriptIssues.length} script(s) sem documentação:`);
        scriptIssues.forEach(issue => {
            console.log(`      - ${issue.file}`);
        });
    }
    
    // 5. Validar skills
    console.log('\n🎓 Skills:');
    const skillIssues = validateSkills();
    if (skillIssues.length === 0) {
        console.log('   ✅ Todas as skills têm documentação');
    } else {
        console.log(`   ⚠️  ${skillIssues.length} skill(s) sem documentação:`);
        skillIssues.forEach(issue => {
            console.log(`      - ${issue.file}`);
        });
    }
    
    // Resumo
    console.log('\n' + '═'.repeat(50));
    const totalIssues = missingDirs.length + namingIssues.length + scriptIssues.length + skillIssues.length;
    
    if (totalIssues === 0) {
        console.log('✅ Workspace válido e consistente\n');
    } else {
        console.log(`⚠️  ${totalIssues} problema(s) encontrado(s)`);
        if (!CONFIG.fixMode && missingDirs.length > 0) {
            console.log('   💡 Use --fix para criar diretórios ausentes automaticamente');
        }
        console.log();
        exitCode = 1;
    }
    
    process.exit(exitCode);
}

main();
