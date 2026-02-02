# Scripts - Kaixa Jr

Coleção de scripts PowerShell para automação e manutenção do ambiente.

## Scripts Disponíveis

### kaixa-watchdog.ps1
Monitora sessões ativas e reinicia agentes travados.
- **Uso:** `.\kaixa-watchdog.ps1`
- **Função:** Verifica se há sessões ativas a cada 5 minutos

### context-compactor.ps1
Limpa sessões com >200k tokens.
- **Uso:** `.\context-compactor.ps1`
- **Função:** Flush contexto para memória quando atinge limite

### state-backup.ps1
Snapshot a cada 10min.
- **Uso:** `.\state-backup.ps1`
- **Função:** Backup do estado git e contexto

### smart-merge.ps1
Pré-check antes de merge + rollback auto.
- **Uso:** `.\smart-merge.ps1 [PR_NUMBER]`
- **Função:** Valida checks e conflitos antes de merge

## Instalação
```powershell
# Permitir execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---
*Gerado automaticamente - melhoria contínua*
