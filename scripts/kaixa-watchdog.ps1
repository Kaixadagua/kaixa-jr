# kaixa-watchdog.ps1 - Monitora e reinicia agentes travados
# Uso: ./kaixa-watchdog.ps1

param(
    [int]$CheckIntervalMinutes = 5,
    [int]$TokenThreshold = 200000
)

Write-Host "🦊 Kaixa Jr Watchdog iniciado..." -ForegroundColor Cyan

while ($true) {
    try {
        # Verificar sessões ativas
        $sessions = openclaw sessions list --active-minutes 10 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if (-not $sessions -or $sessions.count -eq 0) {
            Write-Host "⚠️ Nenhuma sessão ativa detectada. Reiniciando ciclo..." -ForegroundColor Yellow
            
            # Reinicia ciclo contínuo
            $workspace = "C:\Users\joaov\.openclaw\workspace"
            Set-Location $workspace
            
            # Verifica se há trabalho pendente no aurahub
            $pendingWork = gh pr list --repo aura-io-saas/aurahub --state open --author Kaixadagua 2>$null
            
            if ($pendingWork) {
                Write-Host "📋 PRs pendentes encontrados. Continuando trabalho..." -ForegroundColor Green
            } else {
                Write-Host "🔍 Criando nova task fallback..." -ForegroundColor Cyan
                # Task fallback será criada automaticamente pelo agente
            }
        }
        
        # Verificar tokens de contexto
        $status = openclaw status 2>$null
        if ($status -match '(\d+)k/') {
            $tokens = [int]$matches[1] * 1000
            if ($tokens -gt $TokenThreshold) {
                Write-Host "🧹 Contexto cheio ($tokens tokens). Flush necessário..." -ForegroundColor Yellow
            }
        }
        
    } catch {
        Write-Host "❌ Erro no watchdog: $_" -ForegroundColor Red
    }
    
    Write-Host "⏱️ Próxima verificação em $CheckIntervalMinutes minutos..." -ForegroundColor Gray
    Start-Sleep -Seconds ($CheckIntervalMinutes * 60)
}
