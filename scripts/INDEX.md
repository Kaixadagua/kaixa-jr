# 📁 Scripts Index

Índice rápido dos scripts disponíveis em `scripts/`.

## 🚀 Scripts Principais (Enhanced 04:00)

### Node.js
| Script | Descrição | Uso |
|--------|-----------|-----|
| `melhoria-status.js` | Dashboard de melhorias | `node scripts/melhoria-status.js` |
| `health-check.js` | Saúde do ambiente | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits | `node scripts/auto-commit.js` |
| `submodule-manager.js` | Gestão de submódulos | `node scripts/submodule-manager.js` |
| `system-cleanup.js` | Limpeza e manutenção | `node scripts/system-cleanup.js` |

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
*Índice gerado: 2026-02-08 02:28*
*17 melhorias locais consecutivas em backpressure*
