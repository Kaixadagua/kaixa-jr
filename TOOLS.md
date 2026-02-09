# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Scripts - Estrutura Atual (2026-02-09)

Localizados em `scripts/`:

### 🦊 Core Kaixa
| Script | Descrição |
|--------|-----------|
| **kaixa-guardian.js** | Guardian principal - orquestra melhorias e health checks |
| **kaixa-watchdog.ps1** | Monitora sessões ativas, reinicia se travado |
| **kaixa-metrics.js** | Coleta métricas de execução |
| **kaixa-snapshot.js** | Snapshot do estado atual |
| **kaixa-report-35min.js** | Report periódico (35min) |

### 🩺 Health & Monitoring
| Script | Descrição |
|--------|-----------|
| **health-check.js** | Health check geral do sistema |
| **agent-guardian.js** | Monitoramento de agentes |
| **improvement-health.js** | Saúde do pipeline de melhorias |
| **backpressure-analyzer.js** | Análise de backlog de PRs |

### 📝 Melhorias & Tracking
| Script | Descrição |
|--------|-----------|
| **cron-improvement.js** | Execução de melhorias (cron) |
| **improvement-consolidator.js** | Consolida melhorias para batch PR |
| **improvement-quickview.js** | Visualização rápida de melhorias |

### 💾 Contexto & Estado
| Script | Descrição |
|--------|-----------|
| **context-compactor.js** / **.ps1** | Flush contexto quando grande |
| **state-backup.ps1** | Snapshot a cada 10min (git + contexto) |
| **system-cleanup.js** | Limpeza de arquivos temporários |

### 🔧 Git & Deploy
| Script | Descrição |
|--------|-----------|
| **git-safe.js** | Operações seguras de git |
| **auto-commit.js** | Auxilia commits com mensagens sugeridas |
| **smart-merge.ps1** | Pré-check de PRs com rollback |
| **pr-auto-queue.js** | Fila automática de PRs |
| **deploy.sh** | Script de deploy |

### 📊 Relatórios
| Script | Descrição |
|--------|-----------|
| **cron-report.js** | Report elegante para execuções |
| **reports/** | Pasta com relatórios gerados |

### 📚 Documentação
| Arquivo | Descrição |
|---------|-----------|
| **README.md** | Documentação completa dos scripts |
| **INDEX.md** | Índice rápido de referência |
| **QUICK-REF.md** | Referência rápida |

### 🔄 Sync & Lib
| Script | Descrição |
|--------|-----------|
| **sync/** | Scripts de sincronização |
| **lib/** | Bibliotecas compartilhadas |
| **health/** | Checks específicos de saúde |

### 🛠️ Setup & Utilitários
| Script | Descrição |
|--------|-----------|
| **repo-init.js** | Inicialização e organização do repositório |
| **setup-agentcorp.js** | Setup do agentcorp |
| **submodule-manager.js** | Gerenciamento de submódulos |
| **scripts-index.js** | Índice interativo de scripts |

---

## Métricas do Sistema

- **Workspace:** `C:\Users\joaov\.openclaw\workspace`
- **Melhorias:** `memory/improvements/` (36+ melhorias)
- **Cadência:** Cron 5min + Heartbeat 30min
- **Backpressure:** Ativo quando ≥9 PRs abertos

## Repositórios

- **aurahub** (taskemon) → PRs enviados para cá
- **workspace** → Configurações locais e scripts

---

*Atualizado: 2026-02-09 - Reestruturação completa de scripts*
