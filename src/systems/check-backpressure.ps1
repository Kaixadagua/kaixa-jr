# check-backpressure.ps1 - Controle de fluxo de melhorias
# Verifica se deve criar nova melhoria baseado no backlog de PRs
# Última atualização: 2026-02-02 - Enhanced com JSON e stats

param(
    [int]$RedThreshold = 9,
    [int]$YellowThreshold = 6,
    [string]$Repo = "aura-io-saas/aurahub",
    [switch]$Json,
    [switch]$VerboseOutput
)

function Get-BackpressureStatus {
    param([int]$Count, [int]$Red, [int]$Yellow)
    
    if ($Count -ge $Red) { return @{ Status = "red"; Label = "BACKPRESSURE"; CanProceed = $false } }
    elseif ($Count -ge $Yellow) { return @{ Status = "yellow"; Label = "ATENCAO"; CanProceed = $true } }
    else { return @{ Status = "green"; Label = "OK"; CanProceed = $true } }
}

try {
    $prs = gh pr list --repo $Repo --state open --json number,title,createdAt | ConvertFrom-Json
    $count = $prs.Count
    $bp = Get-BackpressureStatus -Count $count -Red $RedThreshold -Yellow $YellowThreshold
    
    $oldestPR = if ($count -gt 0) { 
        ($prs | Sort-Object createdAt | Select-Object -First 1).createdAt 
    } else { $null }
    $oldestHours = if ($oldestPR) { [math]::Round(((Get-Date) - [DateTime]::Parse($oldestPR)).TotalHours, 1) } else { 0 }
    
    if ($Json) {
        $output = @{
            status = $bp.Status
            count = $count
            thresholds = @{ red = $RedThreshold; yellow = $YellowThreshold }
            canProceed = $bp.CanProceed
            oldestHours = $oldestHours
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
        } | ConvertTo-Json -Compress
        Write-Output $output
    } else {
        if ($VerboseOutput -or $bp.Status -eq "red") {
            Write-Host "`n[BACKPRESSURE CHECK]" -ForegroundColor Cyan
            Write-Host "Repo: $Repo" -ForegroundColor Gray
            Write-Host "PRs: $count | Mais antigo: $oldestHours horas" -ForegroundColor White
        }
        
        switch ($bp.Status) {
            "red" {
                Write-Host "[RED] BACKPRESSURE: $count PRs (limite: $RedThreshold)" -ForegroundColor Red
                Write-Host "Modo local ativado. Aguardando revisao." -ForegroundColor Yellow
            }
            "yellow" {
                Write-Host "[YEL] ATENCAO: $count PRs" -ForegroundColor Yellow
            }
            "green" {
                Write-Host "[GRN] OK: $count PRs" -ForegroundColor Green
            }
        }
    }
    
    exit $(if ($bp.CanProceed) { 0 } else { 1 })
} catch {
    if ($Json) {
        @{ error = $_.Exception.Message; canProceed = $false } | ConvertTo-Json -Compress | Write-Output
    } else {
        Write-Host "[ERR] $_" -ForegroundColor Red
    }
    exit 1
}