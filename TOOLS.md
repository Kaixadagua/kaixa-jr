# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Scripts Personalizados (Kaixa Jr)

Localizados em `scripts/`:

- **kaixa-watchdog.ps1** → Monitora sessões ativas, reinicia se travado
- **context-compactor.ps1** → Flush contexto quando >200k tokens
- **state-backup.ps1** → Snapshot a cada 10min (git + contexto)
- **smart-merge.ps1** → Pré-check de PRs com rollback automático
- **git-sync.ps1** → Sincronização segura com remote (dry-run, force)
- **check-backpressure.ps1** → Verifica backlog de PRs (JSON + verbose + oldest PR)
- **melhoria-status.js** → Dashboard de melhorias (categorização, metadados, stats)
- **cron-report.js** → Report elegante para execuções de melhoria contínua
- **scripts-index.js** → Índice interativo de todos os scripts
- **context-compactor.js** → Análise e gestão de contexto
- **repo-init.js** → Inicialização e organização do repositório
- **health-check.js** → Health check com backpressure e sessões
- **auto-commit.js** → Auxilia commits com mensagens sugeridas + backpressure check
- **melhoria-consolidator.js** → Consolida melhorias locais para batch PR
- **status.bat** → Status rápido (git, backpressure, 5 principais scripts)
- **scripts/README.md** → Documentação completa dos scripts
- **scripts/INDEX.md** → Índice rápido de referência

### Uso Rápido
```bash
# Status rápido (Windows)
.\status.bat

# Verificar saúde do ambiente
node scripts/health-check.js

# Verificar backpressure
.\scripts\check-backpressure.ps1

# Status de melhorias
node scripts/melhoria-status.js
```

## Métricas do Sistema

- **Workspace:** `C:\Users\joaov\.openclaw\workspace`
- **Melhorias:** `memory/improvements/` (36 melhorias + CONSOLIDADO-BATCH.md)
- **Cadência:** Cron 5min + Heartbeat 30min
- **Backpressure:** Ativo quando ≥9 PRs abertos

## Repositórios

- **aurahub** (taskemon) → PRs enviados para cá
- **workspace** → Configurações locais e scripts

---

*Atualizado: 2026-02-02 - scripts/README.md atualizado com novos scripts*
