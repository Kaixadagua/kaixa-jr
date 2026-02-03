#!/usr/bin/env node
/**
 * Kaixa Report Sender
 * Verifica e envia reports pendentes (para sessão principal)
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  workspace: 'C:\\Users\\joaov\\.openclaw\\workspace'
};

function checkAndSendPendingReport() {
  const pendingFile = path.join(CONFIG.workspace, 'memory', '.report-pending');
  const reportFile = path.join(CONFIG.workspace, 'memory', 'kaixa-report-latest.txt');
  
  // Verifica se há report pendente
  if (!fs.existsSync(pendingFile)) {
    return null; // Nenhum report pendente
  }
  
  try {
    // Lê o report
    const report = fs.readFileSync(reportFile, 'utf8');
    
    // Remove o flag de pending
    fs.unlinkSync(pendingFile);
    
    return report;
  } catch (e) {
    console.error('Erro ao ler report:', e.message);
    return null;
  }
}

// Se executado diretamente, apenas mostra o report
if (require.main === module) {
  const report = checkAndSendPendingReport();
  if (report) {
    console.log(report);
    process.exit(0);
  } else {
    console.log('Nenhum report pendente.');
    process.exit(1);
  }
}

module.exports = { checkAndSendPendingReport };
