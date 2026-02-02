@echo off
:: status.bat - Status rápido do sistema Kaixa Jr
:: Última atualização: 2026-02-02 - Backpressure + Cores

cd /d "C:\Users\joaov\.openclaw\workspace"

echo ========================================
echo     KAIXA JR - STATUS RAPIDO
echo ========================================
echo.

:: Git Status
echo [Git]
git rev-parse --abbrev-ref HEAD 2>nul >%TEMP%\branch.tmp
set /p BRANCH= <%TEMP%\branch.tmp
echo   Branch: %BRANCH%
del %TEMP%\branch.tmp 2>nul

:: Melhorias
echo.
echo [Melhorias]
node -e "const fs=require('fs'),d='memory/improvements';const c=fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.md')&&f!=='TRACKING.md').length:0;console.log('  Total: '+c);"

:: Backpressure (via node)
echo.
echo [Backpressure]
node -e "const{execSync}=require('child_process');try{const p=execSync('gh pr list --repo aura-io-saas/aurahub --state open',{encoding:'utf8'}).trim();const c=p?p.split('\n').length:0;const s=c>=9?'[RED]':c>=5?'[YEL]':'[GRN]';console.log('  '+s+' PRs abertos: '+c);}catch(e){console.log('  [!] Não verificado');}"

:: Scripts
echo.
echo [Scripts]
echo   status.bat                - Este arquivo
echo   melhoria-status.js        - Dashboard de melhorias
echo   cron-report.js            - Report elegante para cron
echo   agent-guardian.js         - Gestao de agentes
echo   scripts-index.js          - Indice de scripts
echo   context-compactor.js      - Gestao de contexto
echo   repo-init.js              - Inicializacao do repo
echo   health-check.js           - Saude do ambiente
echo   auto-commit.js            - Auxilio a commits
echo   git-sync.ps1              - Sync com remote
echo   melhoria-consolidator.js  - Batch PR consolidado

:: Documentação
echo.
echo [Docs]
echo   memory/README.md     - Índice de navegação
echo   TRACKING.md          - Dashboard de métricas
echo   HEARTBEAT.md         - Regras de melhoria contínua
echo.
echo ----------------------------------------
echo Use: melhoria-status.js para detalhes
echo ----------------------------------------
echo.
