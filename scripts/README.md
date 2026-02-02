# Scripts

Ferramentas utilitárias para o sistema de melhoria contínua.

---

## 📜 Scripts Disponíveis

### Node.js

| Script | Descrição | Uso |
|--------|-----------|-----|
| `melhoria-status.js` | Dashboard de melhorias com categorização automática | `node scripts/melhoria-status.js` |
| `health-check.js` | Saúde do ambiente (git, backpressure, stats) | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits com mensagens sugeridas | `node scripts/auto-commit.js` |
| `melhoria-consolidator.js` | Consolida melhorias para batch PR | `node scripts/melhoria-consolidator.js` |
| `cron-report.js` | Report elegante para execuções de melhoria contínua | `node scripts/cron-report.js` |
| `scripts-index.js` | Índice interativo de todos os scripts | `node scripts/scripts-index.js` |
| `context-compactor.js` | Análise e gestão de contexto | `node scripts/context-compactor.js` |

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

# Dashboard detalhado (Node)
node scripts/melhoria-status.js

# Saúde completa (Node)
node scripts/health-check.js
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
5. Atualizar TRACKING.md

### Preparar batch PR (quando backpressure liberar)
```bash
# Consolidar todas as melhorias locais
node scripts/melhoria-consolidator.js

# Verificar o consolidado gerado
cat memory/improvements/CONSOLIDADO-BATCH.md

# Criar branch e commit quando liberado
node scripts/auto-commit.js
```

---

## 🎯 Convenções

- **Nomeação:** kebab-case (ex: `health-check.js`)
- **Extensão:** `.js` para Node, `.ps1` para PowerShell, `.bat` para Batch
- **Documentação:** Cada script com header explicativo
- **Saída:** Emojis para facilitar leitura visual

---

*Documentação gerada automaticamente - Kaixa Jr 🦊*
