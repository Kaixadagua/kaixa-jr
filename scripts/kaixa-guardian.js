#!/usr/bin/env node
/**
 * @fileoverview Kaixa Guardian - Sistema de gestão saudável de agentes
 * @description Monitora sessões do OpenClaw, tokens e saúde do sistema
 * @author Kaixa Jr 🦊
 * @version 1.4.0
 * @usage node scripts/kaixa-guardian.js [options]
 * 
 * Opções:
 *   -s, --silent    Modo silencioso para cron
 *   -e, --export    Exporta métricas para CSV
 *   -d, --days N    Dias para exportar (padrão: 7)
 *   -c, --compact   Compacta métricas antigas
 *   -h, --help      Mostra ajuda
 * 
 * Exemplos:
 *   node scripts/kaixa-guardian.js
 *   node scripts/kaixa-guardian.js --export --days 30
 *   node scripts/kaixa-guardian.js --compact
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Configuração do Guardian
 * @constant {Object}
 * @property {number} maxAgents - Máximo de agentes simultâneos
 * @property {number} maxTokensPerAgent - Limite de tokens por agente
 * @property {number} warningTokens - Threshold de alerta de tokens
 * @property {number} checkInterval - Intervalo de verificação (ms)
 * @property {string} reportDir - Diretório de relatórios
 * @property {boolean} silentMode - Modo silencioso para cron
 */
const CONFIG = {
    maxAgents: 2,
    maxTokensPerAgent: 180000,
    warningTokens: 150000,
    checkInterval: 300000,
    reportDir: 'scripts/reports'
};

/**
 * Obtém lista de sessões do OpenClaw via CLI
 * @returns {Object} Objeto com array de sessões { sessions: [] }
 */
function getSessionStatus() {
    try {
        const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
        return JSON.parse(output);
    } catch {
        return { sessions: [] };
    }
}

/**
 * Verifica backpressure de PRs no repositório aurahub
 * @returns {Object} Status de backpressure { count: number, status: string }
 * @property {number} count - Quantidade de PRs abertos
 * @property {string} status - 'green'|'yellow'|'red' baseado nos thresholds
 */
function checkBackpressure() {
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
        
        return { count, status };
    } catch {
        return { count: -1, status: 'unknown' };
    }
}

/**
 * Verifica se uma chave de sessão pertence a um cron job
 * @param {string} sessionKey - Chave da sessão
 * @returns {boolean} True se for sessão de cron
 */
function isCronSession(sessionKey) {
    return sessionKey && sessionKey.includes(':cron:');
}

/**
 * Analisa saúde do sistema baseado nas sessões ativas
 * @returns {Object} Status de saúde com agentes, tokens e alertas
 * @property {number} agentCount - Quantidade de subagentes
 * @property {number} totalTokens - Total de tokens em uso
 * @property {number} systemCount - Sessões de sistema ignoradas
 * @property {string[]} warnings - Lista de alertas
 * @property {string} status - Estado: 'healthy'|'warning'|'critical'
 * @property {string} [action] - Ação recomendada se necessário
 * @property {string} timestamp - ISO timestamp da análise
 * @property {Object} backpressure - Status de PRs { count, status }
 */
function analyzeHealth() {
    const status = getSessionStatus();
    const backpressure = checkBackpressure();
    
    let totalTokens = 0;
    let agentCount = 0;
    let cronCount = 0;
    let systemCount = 0;
    let warnings = [];
    
    status.sessions.forEach(s => {
        // Ignorar sessões de cron - são temporárias e esperadas
        if (isCronSession(s.key)) {
            cronCount++;
            return;
        }
        
        // Contar APENAS subagentes reais (kind: "subagent")
        // Sessão principal (main) e outras de sistema não contam
        if (s.kind !== 'subagent') {
            systemCount++;
            return;
        }
        
        totalTokens += s.totalTokens || 0;
        agentCount++;
        
        if (s.totalTokens > CONFIG.maxTokensPerAgent) {
            warnings.push(`⚠️  ${s.key}: ${(s.totalTokens/1000).toFixed(0)}k tokens`);
        }
    });
    
    const health = {
        agentCount,
        totalTokens,
        systemCount,
        warnings,
        backpressure,
        status: 'healthy',
        timestamp: new Date().toISOString()
    };
    
    if (agentCount > CONFIG.maxAgents) {
        health.status = 'critical';
        health.action = 'reduce-agents';
    } else if (totalTokens > CONFIG.warningTokens * CONFIG.maxAgents) {
        health.status = 'warning';
        health.action = 'flush-context';
    }
    
    return health;
}

/**
 * Garante que o diretório de relatórios existe
 * @returns {string} Caminho absoluto do diretório de relatórios
 */
function ensureReportDir() {
    const dir = path.join(process.cwd(), CONFIG.reportDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Carrega histórico de relatórios do dia
 * @returns {Object[]} Array de entradas de saúde anteriores
 */
function loadHistory() {
    const reportDir = ensureReportDir();
    const filename = `guardian-${new Date().toISOString().slice(0,10)}.json`;
    const filepath = path.join(reportDir, filename);
    
    if (fs.existsSync(filepath)) {
        try {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch {}
    }
    return [];
}

/**
 * Calcula tendência de tokens e agentes comparando com histórico
 * @param {Object[]} history - Histórico de análises
 * @param {Object} current - Análise atual
 * @returns {Object} Tendências { tokens: string, agents: string }
 */
function calculateTrend(history, current) {
    if (history.length < 2) return { tokens: 'stable', agents: 'stable' };
    
    const prev = history[history.length - 1];
    const tokenDiff = current.totalTokens - prev.totalTokens;
    const agentDiff = current.agentCount - prev.agentCount;
    
    return {
        tokens: tokenDiff > 10000 ? 'rising' : tokenDiff < -10000 ? 'falling' : 'stable',
        agents: agentDiff > 0 ? 'rising' : agentDiff < 0 ? 'falling' : 'stable'
    };
}

/**
 * Configuração de retenção de métricas
 * @constant {Object}
 */
const RETENTION = {
    maxDailyEntries: 50,      // Máximo de entradas por arquivo diário
    maxArchiveDays: 7,        // Dias para arquivar
    compressionThreshold: 30  // Compactar após 30 dias
};

/**
 * Compacta arquivos de métricas antigos (mantém resumo)
 * @returns {Object} Resultado da compactação
 */
function compactOldMetrics() {
    const reportDir = ensureReportDir();
    const files = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('guardian-') && f.endsWith('.json'));
    
    const today = new Date().toISOString().slice(0, 10);
    const compacted = [];
    
    files.forEach(file => {
        const fileDate = file.slice(9, 19);
        const daysDiff = Math.floor(
            (new Date(today) - new Date(fileDate)) / (1000 * 60 * 60 * 24)
        );
        
        // Compactar arquivos com mais de 7 dias
        if (daysDiff > RETENTION.maxArchiveDays) {
            const filepath = path.join(reportDir, file);
            try {
                const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                
                // Criar resumo em vez de manter todos os dados
                const summary = {
                    date: fileDate,
                    totalEntries: data.length,
                    avgTokens: data.reduce((a, b) => a + (b.totalTokens || 0), 0) / data.length,
                    maxTokens: Math.max(...data.map(d => d.totalTokens || 0)),
                    statusChanges: data.filter((d, i, arr) => 
                        i > 0 && d.status !== arr[i-1].status
                    ).length,
                    _compact: true,
                    _compactedAt: new Date().toISOString()
                };
                
                // Salvar como .summary.json
                const summaryFile = file.replace('.json', '.summary.json');
                fs.writeFileSync(
                    path.join(reportDir, summaryFile),
                    JSON.stringify(summary, null, 2)
                );
                
                // Remover arquivo original
                fs.unlinkSync(filepath);
                compacted.push({ file: summaryFile, entries: data.length });
            } catch (e) {
                console.error(`Erro ao compactar ${file}:`, e.message);
            }
        }
    });
    
    return { compacted, count: compacted.length };
}

/**
 * Exporta métricas para CSV (últimos N dias)
 * @param {number} [days=7] - Quantidade de dias para exportar
 * @returns {string} Caminho do arquivo CSV gerado
 */
function exportToCSV(days = 7) {
    const reportDir = ensureReportDir();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    let allRecords = [];
    
    const files = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('guardian-') && f.endsWith('.json') && !f.includes('.summary'));
    
    files.forEach(file => {
        const fileDate = file.slice(9, 19);
        if (new Date(fileDate) >= cutoff) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(reportDir, file), 'utf8'));
                allRecords = allRecords.concat(data);
            } catch {}
        }
    });
    
    // Ordenar por timestamp
    allRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Gerar CSV
    const headers = 'timestamp,agentCount,totalTokens,status,backpressure_count,backpressure_status\n';
    const rows = allRecords.map(r => 
        `${r.timestamp},${r.agentCount},${r.totalTokens},${r.status},${r.backpressure?.count || 0},${r.backpressure?.status || 'unknown'}`
    ).join('\n');
    
    const csvPath = path.join(reportDir, `guardian-export-${new Date().toISOString().slice(0,10)}.csv`);
    fs.writeFileSync(csvPath, headers + rows);
    
    return csvPath;
}

/**
 * Salva relatório de saúde no arquivo JSON diário
 * @param {Object} health - Dados de saúde atual
 * @param {string} health.timestamp - Timestamp ISO
 * @param {number} health.agentCount - Contagem de agentes
 * @param {number} health.totalTokens - Total de tokens
 * @param {string} health.status - Status de saúde
 * @param {string} [health.action] - Ação recomendada
 */
function saveReport(health) {
    const reportDir = ensureReportDir();
    const filename = `guardian-${new Date().toISOString().slice(0,10)}.json`;
    const filepath = path.join(reportDir, filename);
    
    let reports = [];
    if (fs.existsSync(filepath)) {
        try {
            reports = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch {}
    }
    
    reports.push({
        timestamp: health.timestamp,
        agentCount: health.agentCount,
        totalTokens: health.totalTokens,
        status: health.status,
        action: health.action || null,
        backpressure: health.backpressure
    });
    
    // Manter apenas últimos N registros
    if (reports.length > RETENTION.maxDailyEntries) {
        reports = reports.slice(-RETENTION.maxDailyEntries);
    }
    
    fs.writeFileSync(filepath, JSON.stringify(reports, null, 2));
    
    // Compactar métricas antigas periodicamente (1x por dia, no primeiro registro)
    if (reports.length === 1) {
        compactOldMetrics();
    }
}

/**
 * Parseia argumentos da CLI
 * @returns {Object} Argumentos parseados
 */
function parseArgs() {
    const args = process.argv.slice(2);
    return {
        export: args.includes('--export') || args.includes('-e'),
        exportDays: parseInt(args.find((a, i) => 
            args[i - 1] === '--days' || args[i - 1] === '-d'
        )) || 7,
        compact: args.includes('--compact') || args.includes('-c'),
        silent: args.includes('--silent') || args.includes('-s'),
        help: args.includes('--help') || args.includes('-h')
    };
}

/**
 * Exibe ajuda
 */
function showHelp() {
    console.log(`
🦊 Kaixa Guardian - Uso

Comandos:
  node scripts/kaixa-guardian.js [opções]

Opções:
  -s, --silent       Modo silencioso (apenas para cron)
  -e, --export       Exporta métricas para CSV
  -d, --days N       Dias para exportar (padrão: 7)
  -c, --compact      Compacta métricas antigas
  -h, --help         Mostra esta ajuda

Exemplos:
  node scripts/kaixa-guardian.js
  node scripts/kaixa-guardian.js --export --days 30
  node scripts/kaixa-guardian.js --silent
`);
}

/**
 * Função principal - executa análise e exibe relatório
 * @returns {void}
 */
function main() {
    const args = parseArgs();
    
    if (args.help) {
        showHelp();
        return;
    }
    
    // Exportar CSV se solicitado
    if (args.export) {
        const csvPath = exportToCSV(args.exportDays);
        console.log(`📊 Métricas exportadas: ${csvPath}`);
        return;
    }
    
    // Compactar se solicitado
    if (args.compact) {
        const result = compactOldMetrics();
        console.log(`🗜️  Compactação: ${result.count} arquivos processados`);
        result.compacted.forEach(c => {
            console.log(`   ✓ ${c.file} (${c.entries} entradas)`);
        });
        return;
    }
    
    const health = analyzeHealth();
    const history = loadHistory();
    const trend = calculateTrend(history, health);
    
    // Modo silencioso para cron - só sai se houver problema
    if ((CONFIG.silentMode || args.silent) && health.status === 'healthy') {
        saveReport(health);
        process.exit(0);
    }
    
    console.log('\n🦊 Kaixa Guardian - Gestão Saudável\n');
    console.log('─'.repeat(50));
    
    console.log(`📊 Agentes: ${health.agentCount}/${CONFIG.maxAgents}`);
    console.log(`💾 Tokens: ${(health.totalTokens/1000).toFixed(0)}k/${(CONFIG.maxTokensPerAgent * CONFIG.maxAgents / 1000).toFixed(0)}k`);
    console.log(`📈 Status: ${health.status.toUpperCase()}`);
    
    // Exibir backpressure
    const bpIcon = { green: '🟢', yellow: '🟡', red: '🔴', unknown: '⚪' };
    const bpLabel = health.backpressure.count >= 0 ? `${health.backpressure.count} PRs` : 'N/A';
    console.log(`   ${bpIcon[health.backpressure.status]} Backpressure: ${bpLabel}`);
    
    if (health.systemCount > 0) {
        console.log(`   🖥️  Sessões sistema ignoradas: ${health.systemCount}`);
    }
    
    // Mostrar tendências
    if (history.length > 0) {
        const trendIcon = {
            rising: '📈',
            falling: '📉',
            stable: '➡️'
        };
        console.log(`   ${trendIcon[trend.tokens]} Tokens: ${trend.tokens}`);
    }
    
    if (health.warnings.length > 0) {
        console.log('\n⚠️  Alertas:');
        health.warnings.forEach(w => console.log(`   ${w}`));
    }
    
    if (health.action) {
        console.log(`\n💡 Ação recomendada: ${health.action}`);
        
        if (health.action === 'flush-context') {
            console.log('   → Use /compact ou aguarde auto-flush');
        } else if (health.action === 'reduce-agents') {
            console.log(`   → Limite: ${CONFIG.maxAgents} agente(s) máximo`);
        }
    } else {
        console.log('\n✅ Sistema saudável');
    }
    
    // Salvar relatório
    saveReport(health);
    
    console.log('─'.repeat(50));
    console.log();
}

main();
