# Controle de Backpressure para Melhoria Contínua

## Problema
Backlog crescendo muito rápido (11 PRs em ~40 min).
Taxa: 1 PR a cada ~4 minutos.

## Solução: Script de Backpressure
Verifica número de PRs abertos antes de criar novo.

## Thresholds
- **Verde:** ≤5 PRs - Criar melhorias normalmente
- **Amarelo:** 6-8 PRs - Criar apenas melhorias críticas
- **Vermelho:** ≥9 PRs - Pausar novas melhorias, focar em documentação/gestão

## Implementação
```powershell
# check-backpressure.ps1
$prs = gh pr list --repo aura-io-saas/aurahub --state open --json number | ConvertFrom-Json
$count = $prs.Count

if ($count -ge 9) {
    Write-Host "🔴 BACKPRESSURE: $count PRs abertos. Pausando melhorias."
    exit 1  # Bloqueia criação de novos PRs
} elseif ($count -ge 6) {
    Write-Host "🟡 ATENÇÃO: $count PRs abertos. Apenas melhorias críticas."
    exit 0  # Permite, mas com restrição
} else {
    Write-Host "🟢 OK: $count PRs abertos. Prosseguir com melhoria."
    exit 0
}
```

## Status Atual
🔴 **VERMELHO** - 11 PRs abertos. 
**Ação:** Pausar criação de novos PRs até JUP revisar.

## PRs Abertos (11)
Ver .github/PRIO.md para lista completa e priorização.

---
*Sistema de backpressure - evita sobrecarga de revisão*
