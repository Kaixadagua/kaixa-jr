# Melhoria Local: Correção de INDEX.md

**Data:** 2026-02-08  
**Tipo:** Documentação  
**Modo:** Local (backpressure ativo: 12 PRs)

## Problema
O arquivo `scripts/INDEX.md` continha referências a scripts que não existem mais:
- `melhoria-status.js` - removido
- Lista desatualizada de scripts disponíveis

## Solução
Atualização completa do INDEX.md para refletir:
- Scripts Node.js core existentes (15 scripts)
- Scripts PowerShell disponíveis (6 scripts)
- Scripts Batch (1 script)
- Workflows rápidos atualizados
- Seção de diretórios organizada

## Scripts Documentados

### Core
- kaixa-guardian.js (guardian principal)
- kaixa-metrics.js
- kaixa-snapshot.js
- health-check.js
- improvement-health.js
- improvement-quickview.js
- cron-improvement.js
- cron-report.js
- auto-commit.js
- submodule-manager.js
- system-cleanup.js
- backpressure-analyzer.js
- pr-auto-queue.js
- scripts-index.js
- kaixa-report-35min.js

### PowerShell
- check-backpressure.ps1
- kaixa-watchdog.ps1
- git-sync.ps1
- smart-merge.ps1
- context-compactor.ps1
- state-backup.ps1

### Batch
- status.bat

## Valor
- Documentação precisa e atualizada
- Facilita navegação para humanos
- Reduz confusão sobre scripts disponíveis

---
*Melhoria executada em modo backpressure (sem PR)*
