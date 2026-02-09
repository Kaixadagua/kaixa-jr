# 📁 Scripts Index

Índice rápido dos scripts disponíveis em `scripts/`.

## 🚀 Scripts Principais

### Node.js (Core)
| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-guardian.js` | **Guardian principal** - verifica saúde do sistema | `node scripts/kaixa-guardian.js` |
| `kaixa-metrics.js` | Metrics em tempo real | `node scripts/kaixa-metrics.js --mini` |
| `kaixa-snapshot.js` | Snapshot do estado do sistema | `node scripts/kaixa-snapshot.js` |
| `health-check.js` | Saúde do ambiente | `node scripts/health-check.js` |
| `improvement-health.js` | Health check de melhorias | `node scripts/improvement-health.js` |
| `improvement-quickview.js` | QuickView das últimas melhorias | `node scripts/improvement-quickview.js` |
| `cron-improvement.js` | Script de melhoria do cron | `node scripts/cron-improvement.js` |
| `cron-report.js` | Report periódico | `node scripts/cron-report.js` |
| `auto-commit.js` | Auxilia commits | `node scripts/auto-commit.js` |
| `submodule-manager.js` | Gestão de submódulos | `node scripts/submodule-manager.js` |
| `system-cleanup.js` | Limpeza e manutenção | `node scripts/system-cleanup.js` |
| `backpressure-analyzer.js` | Análise de backpressure | `node scripts/backpressure-analyzer.js` |
| `pr-auto-queue.js` | Fila automática de PRs | `node scripts/pr-auto-queue.js` |
| `scripts-index.js` | Índice interativo | `node scripts/scripts-index.js` |
| `kaixa-report-35min.js` | Report 35min | `node scripts/kaixa-report-35min.js` |

### PowerShell
| Script | Descrição | Uso |
|--------|-----------|-----|
| `check-backpressure.ps1` | Verifica backlog | `.check-backpressure.ps1 -VerboseOutput` |
| `kaixa-watchdog.ps1` | Monitora sessões ativas | `.kaixa-watchdog.ps1` |
| `git-sync.ps1` | Sync com remote | `.git-sync.ps1` |
| `smart-merge.ps1` | Pré-check de PRs | `.smart-merge.ps1` |
| `context-compactor.ps1` | Flush de contexto | `.context-compactor.ps1` |
| `state-backup.ps1` | Snapshot periódico | `.state-backup.ps1` |

### Batch
| Script | Descrição | Uso |
|--------|-----------|-----|
| `status.bat` | Status rápido | `.` (raiz) |

---

## 🔄 Workflows Rápidos

```bash
# Verificar estado
node scripts/kaixa-guardian.js

# Status rápido (Windows)
.

# Verificar backpressure
.check-backpressure.ps1 -Json
node scripts/kaixa-metrics.js --mini

# Antes de commit
node scripts/auto-commit.js

# Quick view melhorias
node scripts/improvement-quickview.js
```

---

## 📂 Diretórios

| Diretório | Conteúdo |
|-----------|----------|
| `health/` | Scripts de health check |
| `reports/` | Relatórios e dashboards |
| `sync/` | Sincronização e backup |
| `lib/` | Bibliotecas compartilhadas |

---

*Índice atualizado: 2026-02-08 23:45*  
*Melhoria local #X - Correção de inconsistências*
