# 📚 Índice Consolidado de Scripts

*Gerado automaticamente em 2026-02-09 - Backpressure: 12 PRs*

## 📊 Estatísticas
- **Total de scripts:** 21 arquivos `.js`
- **Tamanho total:** ~129 KB
- **Última atualização:** 2026-02-09

---

## 🦊 Core Kaixa (Guardião & Métricas)

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `kaixa-guardian.js` | 9.6 KB | 09/02 | Guardian principal - monitora agentes, tokens e backpressure |
| `kaixa-metrics.js` | 11 KB | 08/02 | Coleta e agrega métricas de execução |
| `kaixa-snapshot.js` | 9.4 KB | 08/02 | Snapshot do estado atual do sistema |
| `kaixa-report-35min.js` | 5.5 KB | 04/02 | Report periódico de 35 minutos |

---

## 🩺 Health & Monitoring

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `agent-guardian.js` | 2.4 KB | 02/02 | Monitoramento específico de agentes |
| `health-check.js` | 3.1 KB | 08/02 | Health check geral do sistema |
| `improvement-health.js` | 1.7 KB | 02/02 | Diagnóstico do pipeline de melhorias |
| `backpressure-analyzer.js` | 6.9 KB | 08/02 | Análise de backlog de PRs |

---

## 📝 Melhorias & Tracking

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `cron-improvement.js` | 16.1 KB | 08/02 | **Maior script** - Execução automática de melhorias |
| `improvement-consolidator.js` | 7.6 KB | 09/02 | Consolida melhorias para batch PR |
| `improvement-quickview.js` | 6.8 KB | 08/02 | Visualização rápida de melhorias |
| `pr-auto-queue.js` | 6.9 KB | 08/02 | Fila automática de PRs |

---

## 💾 Contexto & Estado

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `context-compactor.js` | 2 KB | 04/02 | Compactação de contexto quando grande |
| `system-cleanup.js` | 8.5 KB | 08/02 | Limpeza de arquivos temporários |

---

## 🔧 Git & Deploy

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `git-safe.js` | 18.4 KB | 09/02 | **Maior script** - Operações seguras de git |
| `auto-commit.js` | 3.6 KB | 02/02 | Auxilia commits com mensagens sugeridas |

---

## 🛠️ Setup & Utilitários

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `scripts-index.js` | 4.4 KB | 09/02 | Índice interativo de scripts |
| `repo-init.js` | 2.9 KB | 02/02 | Inicialização do repositório |
| `setup-agentcorp.js` | 2 KB | 02/02 | Setup do agentcorp |
| `submodule-manager.js` | 5.9 KB | 08/02 | Gerenciamento de submódulos |

---

## 📊 Relatórios

| Script | Tamanho | Última Mod | Descrição |
|--------|---------|------------|-----------|
| `cron-report.js` | 5.9 KB | 08/02 | Report elegante para execuções de cron |

---

## 🗺️ Arquitetura de Dependências

```
kaixa-guardian.js
    ├── Verifica: agent-guardian.js (status)
    ├── Chama: backpressure-analyzer.js (PRs)
    └── Salva: scripts/reports/guardian-YYYY-MM-DD.json

cron-improvement.js
    ├── Usa: git-safe.js (operações git)
    ├── Usa: improvement-consolidator.js (batch)
    └── Gera: memory/improvements/*.md

improvement-consolidator.js
    ├── Lê: memory/improvements/*.md
    └── Gera: CONSOLIDADO-AUTO-*.md
```

---

## 🔄 Fluxo de Execução (Cron 5min)

```
┌─────────────────┐     ┌──────────────────┐
│  kaixa-guardian │────→│  Backpressure?   │
│   (checagem)    │     │   (≥9 PRs = 🔴)   │
└─────────────────┘     └──────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        ┌──────────────┐              ┌─────────────────┐
        │   < 9 PRs    │              │    ≥ 9 PRs      │
        │   (🟢/🟡)     │              │    (🔴)          │
        └──────┬───────┘              └────────┬────────┘
               ▼                               ▼
    ┌────────────────────┐         ┌─────────────────────┐
    │ cron-improvement   │         │ Melhoria Local      │
    │ → Criar branch     │         │ → Documentação      │
    │ → Implementar      │         │ → Consolidação      │
    │ → Commit → Push    │         │ → Refatoração       │
    │ → PR → Notify      │         │ (sem novo PR)       │
    └────────────────────┘         └─────────────────────┘
```

---

## 📈 Evolução dos Scripts

### Fases de Crescimento

1. **Fase 1 (02/02):** Scripts básicos - guardian, health, git
2. **Fase 2 (04/02):** Relatórios e contexto - reports, compactor
3. **Fase 3 (08/02):** Consolidação - consolidator, metrics, queue
4. **Fase 4 (09/02):** Refinamento - melhorias de UX, docs

### Scripts mais ativos (por modificação)

1. `git-safe.js` (09/02) - 18.4 KB
2. `kaixa-guardian.js` (09/02) - 9.6 KB
3. `improvement-consolidator.js` (09/02) - 7.6 KB
4. `scripts-index.js` (09/02) - 4.4 KB

---

## 🎯 Próximos Refinamentos (Ideias)

- [ ] Script unificado de health (consolidar agent-guardian + health-check)
- [ ] Dashboard HTML dos relatórios
- [ ] CLI interativo para todos os scripts
- [ ] Testes automatizados para scripts críticos

---

*🦊 Documentação gerada durante backpressure - mantém contexto sem sobrecarregar PRs*
