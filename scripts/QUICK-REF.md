# Quick Reference - Scripts Kaixa Jr

## Scripts Principais

### Dashboard & Status
```bash
# Status rápido do sistema
.\status.bat

# Dashboard completo de melhorias
node scripts/melhoria-status.js

# Report elegante para cron
node scripts/cron-report.js

# Índice interativo de scripts
node scripts/scripts-index.js
```

### Diagnóstico & Health
```bash
# Health check do ambiente
node scripts/health-check.js

# Análise de contexto
node scripts/context-compactor.js

# Verificar backpressure
.\scripts\check-backpressure.ps1 -VerboseOutput
```

### Git & Commits
```bash
# Auxiliar de commits
node scripts/auto-commit.js

# Sincronização segura
.\scripts\git-sync.ps1

# Inicializar repositório
node scripts/repo-init.js
```

### Batch & Consolidação
```bash
# Consolidar melhorias
node scripts/melhoria-consolidator.js

# Ver consolidado
cat memory/improvements/CONSOLIDADO-BATCH.md
```

## Workflows

### Modo Backpressure (Local)
1. `node scripts/cron-report.js` - Verificar status
2. Implementar melhoria local
3. Registrar em `memory/improvements/`
4. `node scripts/auto-commit.js` - Preparar commit

### Quando Liberar
1. `node scripts/melhoria-consolidator.js`
2. `node scripts/repo-init.js`
3. Push para origin

## Dicas Rápidas

### Ver tudo em uma linha
```bash
# Status completo em sequência
.\status.bat && node scripts/cron-report.js
```

### Alias úteis (adicionar ao profile)
```powershell
# PowerShell
Set-Alias ks node scripts/scripts-index.js
Set-Alias kc node scripts/cron-report.js
Set-Alias kd node scripts/melhoria-status.js
```

### Troubleshooting
```bash
# Contexto muito grande?
node scripts/context-compactor.js

# Não sabe se pode fazer PR?
.\scripts\check-backpressure.ps1 -VerboseOutput

# Quer ver o que vai commitar?
node scripts/auto-commit.js
```

---
*Atualizado: 2026-02-02*
