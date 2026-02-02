# context-compactor.ps1 - Limpa sessões >200k tokens
# Uso: ./context-compactor.ps1

param(
    [int]$TokenThreshold = 200000,
    [string]$MemoryDir = "C:\Users\joaov\.openclaw\workspace\memory"
)

Write-Host "🧹 Context Compactor - Kaixa Jr" -ForegroundColor Cyan

# Verificar contexto atual
try {
    $statusOutput = openclaw status 2>$null
    
    # Extrair tokens (formato: "14k/400k" ou similar)
    if ($statusOutput -match 'Context:\s*(\d+)k\/(\d+)k') {
        $currentTokens = [int]$matches[1] * 1000
        $maxTokens = [int]$matches[2] * 1000
        
        Write-Host "📊 Tokens: $currentTokens / $maxTokens" -ForegroundColor Gray
        
        if ($currentTokens -gt $TokenThreshold) {
            Write-Host "⚠️ Contexto acima do limite ($TokenThreshold). Compactando..." -ForegroundColor Yellow
            
            # Criar diretório de memória se não existir
            if (-not (Test-Path $MemoryDir)) {
                New-Item -ItemType Directory -Path $MemoryDir -Force | Out-Null
            }
            
            # Nome do arquivo baseado na data
            $date = Get-Date -Format "yyyy-MM-dd"
            $timestamp = Get-Date -Format "HHmm"
            $memoryFile = Join-Path $MemoryDir "$date-flush-$timestamp.md"
            
            # Flush do contexto (salvar resumo)
            $flushContent = @"
# Context Flush - $(Get-Date -Format "yyyy-MM-dd HH:mm")

## Estado Atual
- Tokens: $currentTokens / $maxTokens
- Motivo: Limite de $TokenThreshold atingido

## Resumo da Sessão
- PRs criados: $(gh pr list --repo aura-io-saas/aurahub --state open --author Kaixadagua 2>$null | Measure-Object).Count
- Branches ativas: $(git branch | Measure-Object).Count
- Último checkpoint: $(Get-Date -Format "HH:mm")

## Tarefas em Andamento
Verificar `HEARTBEAT.md` para próximos passos.

---
*Flush automático pelo context-compactor*
"@
            
            $flushContent | Out-File -FilePath $memoryFile -Encoding UTF8
            Write-Host "✅ Contexto salvo em: $memoryFile" -ForegroundColor Green
            
            # Notificar agente para checkpoint
            Write-Host "📝 Checkpoint realizado. Continuando..." -ForegroundColor Cyan
            
        } else {
            Write-Host "✅ Contexto saudável. Nenhuma ação necessária." -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Não foi possível extrair informações de tokens." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}
