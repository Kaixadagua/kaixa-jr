const fs = require('fs');
const path = require('path');

/**
 * Gera dashboard HTML a partir dos relatórios do Guardian
 */

const REPORTS_DIR = path.join(__dirname, 'reports');

function loadReports() {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('guardian-') && f.endsWith('.json'))
    .sort();
  
  const allData = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8'));
    allData.push(...data);
  }
  
  return allData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function generateDashboard(data) {
  const latest = data[data.length - 1];
  const startTime = new Date(data[0].timestamp);
  const endTime = new Date(latest.timestamp);
  const uptime = Math.round((endTime - startTime) / (1000 * 60)); // minutos
  
  // Estatísticas
  const healthyChecks = data.filter(d => d.status === 'healthy').length;
  const avgPRs = Math.round(data.reduce((s, d) => s + d.backpressure.count, 0) / data.length);
  const maxPRs = Math.max(...data.map(d => d.backpressure.count));
  
  // Timeline para gráfico (últimas 24h)
  const last24h = data.filter(d => {
    const hours = (Date.now() - new Date(d.timestamp)) / (1000 * 60 * 60);
    return hours <= 24;
  });
  
  const timeline = last24h.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    prs: d.backpressure.count,
    status: d.status
  }));
  
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🦊 Kaixa Guardian Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 1px solid #30363d;
      margin-bottom: 30px;
    }
    h1 { font-size: 2rem; margin-bottom: 10px; }
    .subtitle { color: #8b949e; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 20px;
    }
    .card h3 {
      font-size: 0.875rem;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .card .value {
      font-size: 2rem;
      font-weight: 700;
    }
    .status-healthy { color: #3fb950; }
    .status-warning { color: #d29922; }
    .status-danger { color: #f85149; }
    .timeline {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 20px;
    }
    .timeline h3 { margin-bottom: 20px; }
    .timeline-bar {
      display: flex;
      gap: 3px;
      height: 40px;
      align-items: flex-end;
    }
    .bar {
      flex: 1;
      min-width: 4px;
      border-radius: 2px;
      transition: opacity 0.2s;
    }
    .bar:hover { opacity: 0.8; }
    .bar.green { background: #238636; }
    .bar.yellow { background: #d29922; }
    .bar.red { background: #da3633; }
    .legend {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      font-size: 0.875rem;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
    footer {
      text-align: center;
      padding: 30px;
      color: #8b949e;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🦊 Kaixa Guardian</h1>
      <p class="subtitle">Dashboard de Saúde do Sistema</p>
    </header>
    
    <div class="grid">
      <div class="card">
        <h3>Status Atual</h3>
        <div class="value status-${latest.status === 'healthy' ? 'healthy' : 'danger'}">
          ${latest.status === 'healthy' ? '✓ HEALTHY' : '✗ ERROR'}
        </div>
      </div>
      <div class="card">
        <h3>Checks Hoje</h3>
        <div class="value status-healthy">${data.length}</div>
      </div>
      <div class="card">
        <h3>Taxa de Sucesso</h3>
        <div class="value status-healthy">${Math.round((healthyChecks / data.length) * 100)}%</div>
      </div>
      <div class="card">
        <h3>PRs em Backpressure</h3>
        <div class="value ${latest.backpressure.status === 'red' ? 'status-danger' : latest.backpressure.status === 'yellow' ? 'status-warning' : 'status-healthy'}">
          ${latest.backpressure.count}
        </div>
      </div>
      <div class="card">
        <h3>Média de PRs (24h)</h3>
        <div class="value ${avgPRs >= 9 ? 'status-danger' : avgPRs >= 6 ? 'status-warning' : 'status-healthy'}">${avgPRs}</div>
      </div>
      <div class="card">
        <h3>Peak de PRs</h3>
        <div class="value ${maxPRs >= 9 ? 'status-danger' : 'status-warning'}">${maxPRs}</div>
      </div>
    </div>
    
    <div class="timeline">
      <h3>Timeline de Backpressure (últimas ${timeline.length} verificações)</h3>
      <div class="timeline-bar">
        ${timeline.map(t => {
          const height = Math.min(100, (t.prs / 15) * 100);
          const color = t.prs >= 9 ? 'red' : t.prs >= 6 ? 'yellow' : 'green';
          return `<div class="bar ${color}" style="height: ${height}%" title="${t.time}: ${t.prs} PRs"></div>`;
        }).join('')}
      </div>
      <div class="legend">
        <div class="legend-item"><div class="legend-color" style="background: #238636"></div> 🟢 ≤5 PRs</div>
        <div class="legend-item"><div class="legend-color" style="background: #d29922"></div> 🟡 6-8 PRs</div>
        <div class="legend-item"><div class="legend-color" style="background: #da3633"></div> 🔴 ≥9 PRs</div>
      </div>
    </div>
    
    <footer>
      <p>Última atualização: ${new Date().toLocaleString('pt-BR')}</p>
      <p>Gerado automaticamente pelo Kaixa Guardian</p>
    </footer>
  </div>
</body>
</html>`;

  return html;
}

// Execução
console.log('🦊 Gerando dashboard...\n');

try {
  const data = loadReports();
  const html = generateDashboard(data);
  
  const outputPath = path.join(REPORTS_DIR, 'dashboard.html');
  fs.writeFileSync(outputPath, html);
  
  console.log(`✅ Dashboard gerado: ${outputPath}`);
  console.log(`📊 Total de registros: ${data.length}`);
  console.log(`📅 Período: ${new Date(data[0].timestamp).toLocaleDateString('pt-BR')} → ${new Date(data[data.length-1].timestamp).toLocaleDateString('pt-BR')}`);
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
