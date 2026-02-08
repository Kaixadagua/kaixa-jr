# 📁 Scripts Index

Índice rápido dos scripts disponíveis em `scripts/`.

## 🚀 Scripts Principais (Enhanced 04:00)

### 🦊 Kaixa CLI (Novo!)
| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-cli.js` | **CLI unificada** - Acesso a todos os comandos | `node scripts/kaixa-cli.js <comando>` |

**Comandos disponíveis:** `status`, `health`, `guardian`, `improve`, `backpressure`, `queue`, `quickview`, `cleanup`, `submodule`, `index`

**Exemplos:**
```bash
node scripts/kaixa-cli.js status      # Status rápido
node scripts/kaixa-cli.js improve     # Dashboard de melhorias
node scripts/kaixa-cli.js bp --json   # Backpressure em JSON
node scripts/kaixa-cli.js q --status  # Fila de PRs
```

### Node.js
| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-dashboard.js` | **Dashboard unificado** | `node scripts/kaixa-dashboard.js` |
| `kaixa-cli.js` | **CLI unificada** | `node scripts/kaixa-cli.js <cmd>` |
| `melhoria-status.js` | Dashboard de melhorias | `node scripts/melhoria-status.js` |
| `health-check.js` | Saúde do ambiente | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits | `node scripts/auto-commit.js` |
| `submodule-manager.js` | Gestão de submódulos | `node scripts/submodule-manager.js` |
| `system-cleanup.js` | Limpeza e manutenção | `node scripts/system-cleanup.js` |
| `improvement-quickview.js` | QuickView de melhorias | `node scripts/improvement-quickview.js` |

### PowerShell
| Script | Descrição | Uso |
|--------|-----------|-----|
| `check-backpressure.ps1` | Verifica backlog | `.\scripts\check-backpressure.ps1 -VerboseOutput` |
| `git-sync.ps1` | Sync com remote | `.\scripts\git-sync.ps1` |

### Batch
| Script | Descrição | Uso |
|--------|-----------|-----|
| `status.bat` | Status rápido | `.\status.bat` (raiz) |

## ⚙️ Scripts de Sistema

| Script | Função |
|--------|--------|
| `kaixa-watchdog.ps1` | Monitora sessões ativas |
| `context-compactor.ps1` | Flush de contexto |
| `state-backup.ps1` | Snapshot periódico |
| `smart-merge.ps1` | Pré-check de PRs |

## 🔄 Workflows

### Verificar estado
```bash
.\status.bat
node scripts/melhoria-status.js
node scripts/health-check.js
node scripts/submodule-manager.js
node scripts/improvement-quickview.js  # Quick view das últimas 5
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

---
*Índice atualizado: 2026-02-08 14:15*
*Melhoria #57 - QuickView de Melhorias adicionado*
