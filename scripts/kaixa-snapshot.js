#!/usr/bin/env node
/**
 * @fileoverview Kaixa Snapshot - Captura de estado do sistema para análise histórica
 * @description Cria snapshots completos do estado do sistema em JSON estruturado
 * @author Kaixa Jr 🦊
 * @version 1.0.0
 * @usage node scripts/kaixa-snapshot.js [--json|-j]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} GitStatus
 * @property {string} branch - Branch atual
 * @property {boolean} isClean - Se o working tree está limpo
 * @property {number} modified - Arquivos modificados
 * @property {number} untracked - Arquivos não rastreados
 */

/**
 * @typedef {Object} ImprovementMetrics
 * @property {number} total - Total de melhorias
 * @property {number} local - Melhorias locais
 * @property {number} pr - Melhorias em PR
 * @property {Object} byType - Distribuição por tipo
 */

/**
 * @typedef {Object} BackpressureStatus
 * @property {number} count - Quantidade de PRs abertos
 * @property {string} status - green|yellow|red|unknown
 * @property {number} duration - Horas em backpressure
 */

/**
 * @typedef {Object} SystemSnapshot
 * @property {string} timestamp - ISO timestamp
 * @property {string} date - Data legível
 * @property {GitStatus} git - Status do git
 * @property {ImprovementMetrics} improvements - Métricas de melhorias
 * @property {BackpressureStatus} backpressure - Status de backpressure
 * @property {Object} workspace - Informações do workspace
 * @property {Object} health - Saúde do sistema
 */

const CONFIG = {
    outputDir: 'memory/snapshots',
    maxSnapshots: 100,
    silentMode: process.argv.includes('--json') || process.argv.includes('-j')
};

/**
 * Executa comando shell e retorna output
 * @param {string} cmd - Comando
 * @param {string} [fallback] - Valor fallback em erro
 * @returns {string}
 */
function exec(cmd, fallback = '') {
    try {
        return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
    } catch {
        return fallback;
    }
}

/**
 * Obtém status do git
 * @returns {GitStatus}
 */
function getGitStatus() {
    const branch = exec('git rev-parse --abbrev-ref HEAD', 'unknown');
    const status = exec('git status --porcelain', '');
    const lines = status ? status.split('\n').filter(Boolean) : [];
    
    const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('A ')).length;
    const untracked = lines.filter(l => l.startsWith('??')).length;
    
    return {
        branch,
        isClean: lines.length === 0,
        modified,
        untracked
    };
}

/**
 * Obtém métricas de melhorias
 * @returns {ImprovementMetrics}
 */
function getImprovementMetrics() {
    const metricsPath = 'memory/improvements/metrics.json';
    let metrics = {
        total: 0,
        local: 0,
        pr: 0,
        byType: {}
    };
    
    if (fs.existsSync(metricsPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
            metrics = {
                total: data.totalImprovements || 0,
                local: data.localImprovements || 0,
                pr: data.prImprovements || 0,
                byType: data.byType || {}
            };
        } catch {}
    }
    
    return metrics;
}

/**
 * Obtém status de backpressure
 * @returns {BackpressureStatus}
 */
function getBackpressureStatus() {
    try {
        const output = execSync('gh pr list --repo aura-io-saas/aurahub --state open --json number', { 
            encoding: 'utf8',
            timeout: 10000 
        });
        const prs = JSON.parse(output);
        const count = prs.length;
        
        let status = 'green';
        if (count >= 9) status = 'red';
        else if (count >= 6) status = 'yellow';
        
        // Calcular duração aproximada do backpressure
        const metricsPath = 'memory/improvements/metrics.json';
        let duration = 0;
        if (fs.existsSync(metricsPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
                duration = data.backpressureDuration || 0;
            } catch {}
        }
        
        return { count, status, duration };
    } catch {
        return { count: -1, status: 'unknown', duration: 0 };
    }
}

/**
 * Obtém informações do workspace
 * @returns {Object}
 */
function getWorkspaceInfo() {
    const workspaceDir = process.cwd();
    
    // Contar arquivos em diretórios importantes
    const dirs = ['scripts', 'memory', 'skills', 'docs'];
    const fileCounts = {};
    
    dirs.forEach(dir => {
        const fullPath = path.join(workspaceDir, dir);
        if (fs.existsSync(fullPath)) {
            try {
                const files = fs.readdirSync(fullPath, { recursive: true });
                fileCounts[dir] = files.filter(f => fs.statSync(path.join(fullPath, f)).isFile()).length;
            } catch {
                fileCounts[dir] = 0;
            }
        } else {
            fileCounts[dir] = 0;
        }
    });
    
    return {
        path: workspaceDir,
        files: fileCounts
    };
}

/**
 * Obtém saúde do sistema via guardian
 * @returns {Object}
 */
function getSystemHealth() {
    try {
        // Tentar carregar último relatório do guardian
        const reportDir = 'scripts/reports';
        const today = new Date().toISOString().slice(0, 10);
        const reportPath = path.join(reportDir, `guardian-${today}.json`);
        
        if (fs.existsSync(reportPath)) {
            const reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            if (reports.length > 0) {
                const latest = reports[reports.length - 1];
                return {
                    agents: latest.agentCount || 0,
                    tokens: latest.totalTokens || 0,
                    status: latest.status || 'unknown'
                };
            }
        }
    } catch {}
    
    return { agents: 0, tokens: 0, status: 'unknown' };
}

/**
 * Cria snapshot completo do sistema
 * @returns {SystemSnapshot}
 */
function createSnapshot() {
    const now = new Date();
    
    return {
        timestamp: now.toISOString(),
        date: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        git: getGitStatus(),
        improvements: getImprovementMetrics(),
        backpressure: getBackpressureStatus(),
        workspace: getWorkspaceInfo(),
        health: getSystemHealth()
    };
}

/**
 * Salva snapshot no arquivo
 * @param {SystemSnapshot} snapshot
 */
function saveSnapshot(snapshot) {
    const dir = path.join(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const filename = `snapshot-${snapshot.timestamp.slice(0, 10)}.json`;
    const filepath = path.join(dir, filename);
    
    let snapshots = [];
    if (fs.existsSync(filepath)) {
        try {
            snapshots = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch {
            snapshots = [];
        }
    }
    
    snapshots.push(snapshot);
    
    // Manter apenas últimos N snapshots
    if (snapshots.length > CONFIG.maxSnapshots) {
        snapshots = snapshots.slice(-CONFIG.maxSnapshots);
    }
    
    fs.writeFileSync(filepath, JSON.stringify(snapshots, null, 2));
    return filepath;
}

/**
 * Formata output visual
 * @param {SystemSnapshot} snapshot
 */
function formatVisual(snapshot) {
    const { git, improvements, backpressure, workspace, health } = snapshot;
    
    console.log('\n🦊 Kaixa Snapshot - Estado do Sistema\n');
    console.log('─'.repeat(50));
    console.log(`📅 ${snapshot.date}`);
    console.log('─'.repeat(50));
    
    // Git
    const gitIcon = git.isClean ? '✅' : '⚠️';
    console.log(`\n${gitIcon} Git (${git.branch})`);
    if (!git.isClean) {
        console.log(`   Modificados: ${git.modified} | Novos: ${git.untracked}`);
    }
    
    // Melhorias
    console.log(`\n📊 Melhorias: ${improvements.total}`);
    console.log(`   Local: ${improvements.local} | PR: ${improvements.pr}`);
    if (improvements.byType) {
        const types = Object.entries(improvements.byType)
            .map(([k, v]) => `${k}:${v}`)
            .join(' ');
        console.log(`   Tipos: ${types}`);
    }
    
    // Backpressure
    const bpIcon = { green: '🟢', yellow: '🟡', red: '🔴', unknown: '⚪' };
    const bpLabel = backpressure.count >= 0 ? `${backpressure.count} PRs` : 'N/A';
    console.log(`\n${bpIcon[backpressure.status]} Backpressure: ${bpLabel}`);
    if (backpressure.duration > 0) {
        console.log(`   Duração: ~${backpressure.duration}h`);
    }
    
    // Workspace
    console.log(`\n📁 Workspace`);
    console.log(`   scripts:${workspace.files.scripts} memory:${workspace.files.memory}`);
    console.log(`   skills:${workspace.files.skills} docs:${workspace.files.docs}`);
    
    // Health
    const healthIcon = health.status === 'healthy' ? '✅' : '⚠️';
    console.log(`\n${healthIcon} Health: ${health.status}`);
    console.log(`   Agentes: ${health.agents} | Tokens: ${Math.round(health.tokens/1000)}k`);
    
    console.log('\n─'.repeat(50));
    console.log(`💾 Salvo: ${CONFIG.outputDir}/snapshot-*.json`);
    console.log();
}

/**
 * Função principal
 */
function main() {
    const snapshot = createSnapshot();
    const filepath = saveSnapshot(snapshot);
    
    if (CONFIG.silentMode) {
        console.log(JSON.stringify(snapshot, null, 2));
    } else {
        formatVisual(snapshot);
    }
    
    return filepath;
}

main();
