# git-sync.ps1 - Sincronização segura do repositório
# Última atualização: 2026-02-02

param(
    [switch]$Force,      # Força sync mesmo com alterações pendentes
    [switch]$DryRun      # Mostra o que seria feito sem executar
)

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Status($emoji, $text, $color = "White") {
    Write-Host "  [$emoji] $text" -ForegroundColor $color
}

try {
    $workspace = "C:\Users\joaov\.openclaw\workspace"
    Set-Location $workspace
    
    Write-Header "GIT SYNC - Kaixa Jr"
    
    # Verificar se é um repo git
    $isGit = git rev-parse --git-dir 2>$null
    if (-not $isGit) {
        Write-Status "X" "Não é um repositório git" "Red"
        exit 1
    }
    
    # Informações do repo
    $branch = git branch --show-current
    try {
        $remote = git remote get-url origin 2>$null
    } catch {
        $remote = $null
    }
    Write-Status "i" "Branch: $branch" "Gray"
    if ($remote) {
        Write-Status "i" "Remote: $remote" "Gray"
    } else {
        Write-Status "!" "Sem remote configurado" "Yellow"
    }
    
    # Verificar alterações pendentes
    Write-Header "Status Local"
    $status = git status --short
    if ($status) {
        $lines = $status -split "`n"
        Write-Status "!" "$($lines.Count) arquivo(s) modificado(s)" "Yellow"
        $lines | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
        
        if (-not $Force -and -not $DryRun) {
            Write-Status "X" "Alterações pendentes. Use -Force para ignorar ou commite primeiro" "Red"
            exit 1
        }
    } else {
        Write-Status "OK" "Working directory limpo" "Green"
    }
    
    # Fetch do remoto (se existir)
    if ($remote) {
        Write-Header "Sync com Remote"
        if ($DryRun) {
            Write-Status "DRY" "git fetch origin" "Yellow"
        } else {
            Write-Status "..." "Buscando atualizações..." "Gray"
            git fetch origin
            Write-Status "OK" "Fetch completo" "Green"
        }
        
        # Verificar commits atrás/frente
        $behind = git rev-list --count HEAD..origin/$branch 2>$null
        $ahead = git rev-list --count origin/$branch..HEAD 2>$null
    } else {
        $behind = 0
        $ahead = 0
    }
    
    if ($behind -gt 0) {
        Write-Status "!" "$behind commit(s) atrás do remote" "Yellow"
        if ($DryRun) {
            Write-Status "DRY" "git pull origin $branch" "Yellow"
        } else {
            if ($Force -or -not $status) {
                Write-Status "..." "Fazendo pull..." "Gray"
                git pull origin $branch
                Write-Status "OK" "Pull completo" "Green"
            }
        }
    } else {
        Write-Status "OK" "Branch atualizada com remote" "Green"
    }
    
    if ($ahead -gt 0) {
        Write-Status "!" "$ahead commit(s) à frente do remote" "Yellow"
        Write-Status "i" "Faça push manual quando pronto" "Gray"
    }
    
    # Resumo
    Write-Header "Resumo"
    if ($DryRun) {
        Write-Status "DRY" "Modo dry-run - nenhuma alteração feita" "Yellow"
    } else {
        $finalStatus = git status --short
        if ($finalStatus) {
            Write-Status "!" "Ainda há alterações pendentes" "Yellow"
        } else {
            Write-Status "OK" "Repositório sincronizado" "Green"
        }
    }
    
    Write-Host ""
    
} catch {
    Write-Status "X" "Erro: $_" "Red"
    exit 1
}