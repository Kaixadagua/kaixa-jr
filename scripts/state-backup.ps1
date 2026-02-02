# state-backup.ps1 - Snapshot a cada 10min
# Uso: ./state-backup.ps1

param(
    [int]$IntervalMinutes = 10,
    [string]$BackupDir = "C:\Users\joaov\.openclaw\workspace\.backups"
)

Write-Host "💾 State Backup - Kaixa Jr" -ForegroundColor Cyan
Write-Host "📍 Diretório: $BackupDir" -ForegroundColor Gray
Write-Host "⏱️ Intervalo: $IntervalMinutes minutos" -ForegroundColor Gray

# Criar diretório de backup se não existir
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "📁 Diretório de backup criado" -ForegroundColor Green
}

while ($true) {
    try {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
        $backupName = "kaixa-backup-$timestamp"
        
        Write-Host "🔄 Criando backup: $backupName..." -ForegroundColor Cyan
        
        # Salvar estado atual
        $aurahubPath = "C:\Users\joaov\.openclaw\workspace\taskemon"
        if (Test-Path $aurahubPath) {
            Set-Location $aurahubPath
            
            # Stash do estado atual
            $stashMessage = "auto-backup-$timestamp"
            git stash push -m $stashMessage 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Git stash: $stashMessage" -ForegroundColor Green
            }
        }
        
        # Salvar resumo em arquivo
        $backupFile = Join-Path $BackupDir "$backupName.md"
        $backupContent = @"
# State Backup - $(Get-Date -Format "yyyy-MM-dd HH:mm")

## Git Status
$(git status --short 2>$null)

## Branches Locais
$(git branch --format="%(refname:short)" 2>$null)

## Últimos Commits
$(git log --oneline -3 2>$null)

## PRs Abertos (Kaixadagua)
$(gh pr list --repo aura-io-saas/aurahub --state open --author Kaixadagua 2>$null)

## Notas
- Backup automático a cada $IntervalMinutes minutos
- Workspace: $(Get-Location)

---
"@
        
        $backupContent | Out-File -FilePath $backupFile -Encoding UTF8
        Write-Host "✅ Backup salvo: $backupFile" -ForegroundColor Green
        
        # Limpar backups antigos (manter últimos 10)
        $backups = Get-ChildItem $BackupDir -Filter "kaixa-backup-*.md" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 10) {
            $backups | Select-Object -Skip 10 | Remove-Item -Force
            Write-Host "🗑️ Backups antigos removidos" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "❌ Erro no backup: $_" -ForegroundColor Red
    }
    
    Write-Host "⏱️ Próximo backup em $IntervalMinutes minutos..." -ForegroundColor Gray
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}
