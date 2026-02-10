# 📁 Scripts Index

Índice rápido dos scripts disponíveis em `scripts/`.

**Para documentação completa:** [`README.md`](README.md)

---

## 🚀 Scripts Principais

| Script | Descrição | Uso Rápido |
|--------|-----------|------------|
| `kaixa-guardian.js` | 🦊 Guardian principal - saúde do sistema | `node scripts/kaixa-guardian.js` |
| `health-check.js` | Saúde completa (git, backpressure, stats) | `node scripts/health-check.js` |
| `melhoria-viewer.js` | Visualização interativa de melhorias | `node scripts/melhoria-viewer.js` |
| `melhoria-status.js` | Dashboard de melhorias | `node scripts/melhoria-status.js` |
| `kaixa-metrics.js` | Métricas em tempo real | `node scripts/kaixa-metrics.js --mini` |
| `auto-commit.js` | Auxilia commits com sugestões | `node scripts/auto-commit.js` |
| `improvement-quickview.js` | QuickView das últimas 5 melhorias | `node scripts/improvement-quickview.js` |
| `scripts-index.js` | Índice interativo de todos os scripts | `node scripts/scripts-index.js` |

---

## 🔄 Git & Deploy

| Script | Descrição | Uso Rápido |
|--------|-----------|------------|
| `git-safe.js` | Wrapper seguro para operações git | `node scripts/git-safe.js status` |
| `check-backpressure.ps1` | Verifica backlog de PRs | `.\scripts\check-backpressure.ps1 -VerboseOutput` |
| `smart-merge.ps1` | Pré-check de PRs com rollback | `.\scripts\smart-merge.ps1` |
| `git-sync.ps1` | Sincronização segura com remote | `.\scripts\git-sync.ps1` |

---

## 💾 Backup & Estado

| Script | Descrição | Uso Rápido |
|--------|-----------|------------|
| `kaixa-snapshot.js` | Snapshot do estado do sistema | `node scripts/kaixa-snapshot.js` |
| `state-backup.ps1` | Snapshot a cada 10min (git + contexto) | `.\scripts\state-backup.ps1` |
| `context-compactor.js` | Flush de contexto quando grande | `node scripts/context-compactor.js` |
| `context-compactor.ps1` | Flush de contexto (>200k tokens) | `.\scripts\context-compactor.ps1` |

---

## ⚙️ Workflows Comuns

### Verificar estado do sistema
```bash
# Status rápido (batch)
.\status.bat

# Guardian principal
node scripts/kaixa-guardian.js

# Saúde completa
node scripts/health-check.js
```

### Antes de criar melhoria
```bash
# Verificar backpressure
.\scripts\check-backpressure.ps1 -VerboseOutput

# Se GREEN (≤5 PRs): criar PR
# Se YELLOW (6-8): apenas críticas
# Se RED (≥9): melhoria local
```

### Operações Git Seguras
```bash
# Status
node scripts/git-safe.js status

# Feature branch completo
node scripts/git-safe.js create-branch feature/nome
node scripts/git-safe.js add .
node scripts/git-safe.js commit "feat: descrição"
node scripts/git-safe.js push feature/nome
```

---

## 📊 Status dos Scripts

| Script | Status |
|--------|--------|
| `kaixa-guardian.js` | ✅ Estável |
| `health-check.js` | ✅ Estável |
| `melhoria-viewer.js` | ✅ Estável |
| `auto-commit.js` | ✅ Estável |
| `check-backpressure.ps1` | ✅ Estável |
| `git-safe.js` | 🆕 Novo |
| `kaixa-snapshot.js` | 🆕 Novo |
| `kaixa-watchdog.ps1` | ⚠️ Legado |

**Legenda:** ✅ Estável | 📝 Beta | 🆕 Novo | ⚠️ Legado

---

*Índice atualizado: 2026-02-10 - Kaixa Jr 🦊*
