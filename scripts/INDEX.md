# 📁 Scripts Index

Índice rápido dos scripts disponíveis em `scripts/`.

## 🦊 Scripts Kaixa Guardian (Cron 5min)

| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-guardian.js` | **Guardião principal** - verifica saúde do sistema, backpressure, agentes | `node scripts/kaixa-guardian.js` |
| `kaixa-report-35min.js` | **Relatório periódico** - status geral e métricas | `node scripts/kaixa-report-35min.js` |
| `improvement-health.js` | **Health check** de melhorias pendentes | `node scripts/improvement-health.js` |

## 🚀 Scripts de Automação

### Node.js
| Script | Descrição | Uso |
|--------|-----------|-----|
| `health-check.js` | Saúde do ambiente (legado) | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits com mensagens sugeridas | `node scripts/auto-commit.js` |
| `submodule-manager.js` | Gestão de submódulos git | `node scripts/submodule-manager.js` |
| `context-compactor.js` | Análise e gestão de contexto | `node scripts/context-compactor.js` |
| `repo-init.js` | Inicialização do repositório | `node scripts/repo-init.js` |
| `scripts-index.js` | Índice interativo de scripts | `node scripts/scripts-index.js` |
| `agent-guardian.js` | Monitor de agentes ativos | `node scripts/agent-guardian.js` |

### PowerShell
| Script | Descrição | Uso |
|--------|-----------|-----|
| `check-backpressure.ps1` | Verifica backlog de PRs | `.\scripts\check-backpressure.ps1 -VerboseOutput` |
| `kaixa-watchdog.ps1` | Monitora sessões ativas | `.\scripts\kaixa-watchdog.ps1` |
| `context-compactor.ps1` | Flush de contexto >200k tokens | `.\scripts\context-compactor.ps1` |
| `state-backup.ps1` | Snapshot a cada 10min | `.\scripts\state-backup.ps1` |
| `smart-merge.ps1` | Pré-check de PRs com rollback | `.\scripts\smart-merge.ps1` |
| `git-sync.ps1` | Sync seguro com remote | `.\scripts\git-sync.ps1 -DryRun` |

### Batch
| Script | Descrição | Uso |
|--------|-----------|-----|
| `status.bat` | Status rápido (git + backpressure) | `.\status.bat` (raiz) |

## 📂 Subdiretórios

| Pasta | Conteúdo |
|-------|----------|
| `health/` | Scripts de health check especializados |
| `reports/` | Relatórios gerados automaticamente |
| `sync/` | Scripts de sincronização |

## 🔄 Workflows

### Verificar estado completo
```bash
.\status.bat                    # Status rápido
node scripts/kaixa-guardian.js  # Guardião principal
```

### Antes de commit
```bash
node scripts/auto-commit.js
.\scripts\git-sync.ps1 -DryRun
```

### Verificar backpressure
```bash
.\scripts\check-backpressure.ps1 -Json
```

## 📊 Status Atual
- 🔴 Backpressure: **12 PRs abertos** (crítico)
- 🟢 Agentes: 0/2 ativos
- 🟢 Tokens: stable
- 📁 Melhorias: 97 arquivos em `memory/improvements/`

---
*Índice atualizado: 2026-02-08 02:36*
*Melhoria local #18 em modo backpressure* 🦊
