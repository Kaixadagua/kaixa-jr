# smart-merge.ps1 - Pré-check antes de merge + rollback auto
# Uso: ./smart-merge.ps1 [PR_NUMBER]

param(
    [Parameter(Mandatory=$false)]
    [string]$PRNumber,
    
    [string]$Repo = "aura-io-saas/aurahub",
    [string]$BaseBranch = "master"
)

Write-Host "🔀 Smart Merge - Kaixa Jr" -ForegroundColor Cyan

# Se não foi passado PR_NUMBER, listar PRs aprovados
try {
    if (-not $PRNumber) {
        Write-Host "📋 Buscando PRs aprovados..." -ForegroundColor Cyan
        $approvedPRs = gh pr list --repo $Repo --state open --author Kaixadagua --json number,title,reviewDecision | ConvertFrom-Json | Where-Object { $_.reviewDecision -eq "APPROVED" }
        
        if (-not $approvedPRs) {
            Write-Host "⚠️ Nenhum PR aprovado encontrado." -ForegroundColor Yellow
            exit 0
        }
        
        Write-Host "✅ PRs aprovados encontrados:" -ForegroundColor Green
        $approvedPRs | ForEach-Object { Write-Host "   - #$($_.number): $($_.title)" }
        
        # Pegar o primeiro PR aprovado
        $PRNumber = $approvedPRs[0].number
    }
    
    Write-Host "🔍 Verificando PR #$PRNumber..." -ForegroundColor Cyan
    
    # Verificar checks
    Write-Host "   ⏳ Verificando checks..." -ForegroundColor Gray
    gh pr checks $PRNumber --repo $Repo
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Checks falharam. Abortando merge." -ForegroundColor Red
        
        # Comentar no PR
        gh pr comment $PRNumber --repo $Repo --body "❌ Smart Merge: Checks falharam. Requer correção antes do merge."
        exit 1
    }
    
    Write-Host "   ✅ Checks passaram" -ForegroundColor Green
    
    # Verificar conflitos
    Write-Host "   ⏳ Verificando conflitos..." -ForegroundColor Gray
    $prInfo = gh pr view $PRNumber --repo $Repo --json mergeStateStatus,mergeable | ConvertFrom-Json
    
    if ($prInfo.mergeable -ne "MERGEABLE") {
        Write-Host "❌ Conflitos detectados. Abortando merge." -ForegroundColor Red
        gh pr comment $PRNumber --repo $Repo --body "❌ Smart Merge: Conflitos detectados. Requer rebase."
        exit 1
    }
    
    Write-Host "   ✅ Sem conflitos" -ForegroundColor Green
    
    # Realizar merge
    Write-Host "🚀 Realizando merge..." -ForegroundColor Cyan
    gh pr merge $PRNumber --repo $Repo --squash --delete-branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Merge realizado com sucesso!" -ForegroundColor Green
        
        # Notificar
        gh pr comment $PRNumber --repo $Repo --body "✅ Smart Merge: Merge realizado com sucesso por Kaixa Jr."
    } else {
        Write-Host "❌ Falha no merge. Tentando rollback..." -ForegroundColor Red
        
        # Rollback automático
        git reset --hard HEAD~1 2>$null
        Write-Host "⚠️ Rollback executado" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    exit 1
}
