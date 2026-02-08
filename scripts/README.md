# Scripts

Ferramentas utilitárias para o sistema de melhoria contínua.

---

## 📁 Diretórios

| Diretório | Conteúdo |
|-----------|----------|
| `health/` | Scripts específicos de health check |
| `reports/` | Geração de relatórios e dashboards |
| `sync/` | Sincronização e backup |

---

## 📜 Scripts Disponíveis

### Node.js

| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-guardian.js` | Guardian principal - verifica saúde do sistema | `node scripts/kaixa-guardian.js` |
| `kaixa-sessions.js` | Listador de sessões ativas do OpenClaw | `node scripts/kaixa-sessions.js` |
| `kaixa-report-35min.js` | Report periódico de status (35min) | `node scripts/kaixa-report-35min.js` |
| `improvement-health.js` | Health check específico de melhorias | `node scripts/improvement-health.js` |
| `health-check.js` | Saúde geral do ambiente (git, backpressure, stats) | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits com mensagens sugeridas | `node scripts/auto-commit.js` |
| `scripts-index.js` | Índice interativo de todos os scripts | `node scripts/scripts-index.js` |
| `context-compactor.js` | Análise e gestão de contexto | `node scripts/context-compactor.js` |
| `repo-init.js` | Inicialização e organização do repositório | `node scripts/repo-init.js` |
| `agent-guardian.js` | Guardian de agentes (legado) | `node scripts/agent-guardian.js` |
| `setup-agentcorp.js` | Setup inicial do AgentCorp | `node scripts/setup-agentcorp.js` |
| `consolidate-reports.js` | Consolida reports pendentes em arquivo semanal | `node scripts/consolidate-reports.js` |

### PowerShell

| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-watchdog.ps1` | Monitora sessões ativas, reinicia se travado | `.\scripts\kaixa-watchdog.ps1` |
| `context-compactor.ps1` | Flush contexto quando >200k tokens | `.\scripts\context-compactor.ps1` |
| `state-backup.ps1` | Snapshot a cada 10min (git + contexto) | `.\scripts\state-backup.ps1` |
| `smart-merge.ps1` | Pré-check de PRs com rollback automático | `.\scripts\smart-merge.ps1` |
| `check-backpressure.ps1` | Verifica backlog (JSON: `-Json`, verbose: `-VerboseOutput`) | `.\scripts\check-backpressure.ps1 -VerboseOutput` |
| `git-sync.ps1` | Sincronização segura com remote (dry-run, force) | `.\scripts\git-sync.ps1` |

### Batch (Windows)

| Script | Descrição | Uso |
|--------|-----------|-----|
| `status.bat` | Status rápido (git, backpressure, melhorias) | `.\status.bat` (raiz) |

---

## 🔄 Workflows Comuns

### Verificar estado do sistema
```bash
# Status rápido (batch)
.\status.bat

# Guardian principal (Node)
node scripts/kaixa-guardian.js

# Saúde completa (Node)
node scripts/health-check.js

# Health de melhorias (Node)
node scripts/improvement-health.js
```

### Antes de criar melhoria
```bash
# Verificar backpressure
.\scripts\check-backpressure.ps1 -VerboseOutput

# Se GREEN ou YELLOW: criar PR
# Se RED: melhoria local
```

### Modo backpressure (local)
1. Verificar backlog: `.\scripts\check-backpressure.ps1 -Json`
2. Implementar melhoria local (docs, scripts, config)
3. Registrar: `memory/improvements/YYYY-MM-DD-HHMM-melhoria.md`
4. Preparar commit: `node scripts/auto-commit.js`

### Consolidar reports acumulados
```bash
# Quando há múltiplos reports pendentes em memory/reports/
node scripts/consolidate-reports.js
```
- Consolida todos os reports `.txt` em um arquivo markdown semanal
- Remove arquivos individuais após consolidação
- Gera estatísticas de melhorias por período

### Quando backpressure liberar
```bash
# Verificar status
node scripts/health-check.js

# Criar branch e commit quando GREEN
node scripts/auto-commit.js
```

---

## 🎯 Convenções

- **Nomeação:** kebab-case (ex: `health-check.js`)
- **Extensão:** `.js` para Node, `.ps1` para PowerShell, `.bat` para Batch
- **Documentação:** Cada script com header explicativo
- **Saída:** Emojis para facilitar leitura visual

---

*Atualizado: 2026-02-04 - Kaixa Jr 🦊*
