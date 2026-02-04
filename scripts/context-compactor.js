#!/usr/bin/env node
// context-compactor.js - Compactação de contexto para sessões Kaixa
// Uso: node scripts/context-compactor.js [--auto]

const { execSync } = require('child_process');

const CONFIG = {
    tokenThreshold: 150000,
    compactRatio: 0.6  // Manter 60% do contexto mais recente
};

function getSessions() {
    try {
        const output = execSync('openclaw sessions list --json', { encoding: 'utf8' });
        return JSON.parse(output).sessions || [];
    } catch {
        return [];
    }
}

function compactSession(sessionKey, currentTokens) {
    try {
        // Enviar mensagem de sistema para compactar
        execSync(`openclaw sessions send --sessionKey "${sessionKey}" --message "[[SYSTEM_COMPACT]]"`, { encoding: 'utf8' });
        return true;
    } catch {
        return false;
    }
}

function main() {
    const isAuto = process.argv.includes('--auto');
    const sessions = getSessions();
    
    let compacted = 0;
    
    sessions.forEach(s => {
        // Pular sessões de cron
        if (s.key && s.key.includes(':cron:')) return;
        
        if (s.totalTokens > CONFIG.tokenThreshold) {
            if (isAuto || process.argv.includes('--all')) {
                const success = compactSession(s.key, s.totalTokens);
                if (success) {
                    console.log(`✅ Compactado: ${s.key.slice(0, 40)}... (${(s.totalTokens/1000).toFixed(0)}k tokens)`);
                    compacted++;
                } else {
                    console.log(`❌ Falha: ${s.key.slice(0, 40)}...`);
                }
            } else {
                console.log(`⚠️  Alto uso: ${s.key.slice(0, 40)}... (${(s.totalTokens/1000).toFixed(0)}k tokens)`);
            }
        }
    });
    
    if (compacted === 0 && !isAuto) {
        console.log('✅ Nenhuma sessão precisa de compactação');
    } else if (compacted > 0) {
        console.log(`\n📊 Total: ${compacted} sessão(ões) compactada(s)`);
    }
}

main();
