# Scripts

Ferramentas utilitárias para o sistema de melhoria contínua.

---

## 📁 Diretórios

| Diretório | Conteúdo |
|-----------|----------|
| `health/` | Scripts específicos de health check |
| `reports/` | Geração de relatórios e dashboards |
| `sync/` | Sincronização e backup |

---

## 📜 Scripts Disponíveis

### Node.js

| Script | Descrição | Uso |
|--------|-----------|-----|
| `git-safe.js` | Wrapper seguro para operações git (retry, logging) | `node scripts/git-safe.js status` |
| `kaixa-guardian.js` | Guardian principal - verifica saúde do sistema | `node scripts/kaixa-guardian.js` |
| `kaixa-report-35min.js` | Report periódico de status (35min) | `node scripts/kaixa-report-35min.js` |
| `improvement-health.js` | Health check específico de melhorias | `node scripts/improvement-health.js` |
| `health-check.js` | Saúde geral do ambiente (git, backpressure, stats) | `node scripts/health-check.js` |
| `auto-commit.js` | Auxilia commits com mensagens sugeridas | `node scripts/auto-commit.js` |
| `scripts-index.js` | Índice interativo de todos os scripts | `node scripts/scripts-index.js` |
| `context-compactor.js` | Análise e gestão de contexto | `node scripts/context-compactor.js` |
| `repo-init.js` | Inicialização e organização do repositório | `node scripts/repo-init.js` |
| `agent-guardian.js` | Guardian de agentes (legado) | `node scripts/agent-guardian.js` |
| `setup-agentcorp.js` | Setup inicial do AgentCorp | `node scripts/setup-agentcorp.js` |
| `kaixa-snapshot.js` | Captura snapshot do estado do sistema | `node scripts/kaixa-snapshot.js` |
| `improvement-consolidator.js` | Consolida melhorias locais em relatórios | `node scripts/improvement-consolidator.js --auto` |

### PowerShell

| Script | Descrição | Uso |
|--------|-----------|-----|
| `kaixa-watchdog.ps1` | Monitora sessões ativas, reinicia se travado | `.\scripts\kaixa-watchdog.ps1` |
| `context-compactor.ps1` | Flush contexto quando >200k tokens | `.\scripts\context-compactor.ps1` |
| `state-backup.ps1` | Snapshot a cada 10min (git + contexto) | `.\scripts\state-backup.ps1` |
| `smart-merge.ps1` | Pré-check de PRs com rollback automático | `.\scripts\smart-merge.ps1` |
| `check-backpressure.ps1` | Verifica backlog (JSON: `-Json`, verbose: `-VerboseOutput`) | `.\scripts\check-backpressure.ps1 -VerboseOutput` |
| `git-sync.ps1` | Sincronização segura com remote (dry-run, force) | `.\scripts\git-sync.ps1` |

### Batch (Windows)

| Script | Descrição | Uso |
|--------|-----------|-----|
| `status.bat` | Status rápido (git, backpressure, melhorias) | `.\status.bat` (raiz) |

---

## 🔄 Workflows Comuns

### Verificar estado do sistema
```bash
# Status rápido (batch)
.\status.bat

# Guardian principal (Node)
node scripts/kaixa-guardian.js

# Saúde completa (Node)
node scripts/health-check.js

# Health de melhorias (Node)
node scripts/improvement-health.js
```

### Antes de criar melhoria
```bash
# Verificar backpressure
.\scripts\check-backpressure.ps1 -VerboseOutput

# Se GREEN ou YELLOW: criar PR
# Se RED: melhoria local
```

### Modo backpressure (local)
1. Verificar backlog: `.\scripts\check-backpressure.ps1 -Json`
2. Implementar melhoria local (docs, scripts, config)
3. Registrar: `memory/improvements/YYYY-MM-DD-HHMM-melhoria.md`
4. Preparar commit: `node scripts/auto-commit.js`

### Quando backpressure liberar
```bash
# Verificar status
node scripts/health-check.js

# Criar branch e commit quando GREEN
node scripts/auto-commit.js
```

### Operações Git Seguras
```bash
# Status do repositório
node scripts/git-safe.js status

# Criar branch e commit
node scripts/git-safe.js feature nome-branch "mensagem do commit"

# Pull com stash automático
node scripts/git-safe.js safe-pull

# Workflow completo (feature branch)
node scripts/git-safe.js create-branch feature/nova-func
node scripts/git-safe.js add .
node scripts/git-safe.js commit "feat: nova funcionalidade"
node scripts/git-safe.js push feature/nova-func
```

### Snapshot do sistema
```bash
# Snapshot completo com saída visual
node scripts/kaixa-snapshot.js

# Snapshot em JSON (para automação)
node scripts/kaixa-snapshot.js --json

# Snapshots são salvos em memory/snapshots/
```

---

## 🎯 Convenções

- **Nomeação:** kebab-case (ex: `health-check.js`)
- **Extensão:** `.js` para Node, `.ps1` para PowerShell, `.bat` para Batch
- **Documentação:** Cada script com header explicativo
- **Saída:** Emojis para facilitar leitura visual

---

## 📊 Status dos Scripts

Indicadores de maturidade e manutenção:

| Script | Status | Descrição |
|--------|--------|-----------|
| `kaixa-guardian.js` | ✅ Estável | Core do sistema, testado em produção |
| `health-check.js` | ✅ Estável | Health check completo com métricas |
| `auto-commit.js` | ✅ Estável | Auxiliar de commits com análise |
| `scripts-index.js` | ✅ Estável | Índice interativo funcional |
| `check-backpressure.ps1` | ✅ Estável | Backpressure detection funcional |
| `status.bat` | ✅ Estável | Status rápido diário |
| `kaixa-report-35min.js` | 📝 Beta | Reports periódicos, em validação |
| `improvement-health.js` | 📝 Beta | Health específico de melhorias |
| `context-compactor.js` | 🆕 Novo | Recém criado, em testes |
| `smart-merge.ps1` | 🆕 Novo | Merge inteligente, em testes |
| `git-safe.js` | 🆕 Novo | Wrapper seguro para git, validação em andamento |
| `kaixa-snapshot.js` | 🆕 Novo | Snapshot de estado do sistema, em testes |
| `improvement-consolidator.js` | 🆕 Novo | Consolidação automática de melhorias, recém criado |
| `kaixa-watchdog.ps1` | ⚠️ Legado | Funcional mas será substituído |
| `agent-guardian.js` | ⚠️ Legado | Versão anterior do guardian |

**Legenda:**
- ✅ Estável — Testado em produção, confiável
- 📝 Beta — Funcional mas em observação
- 🆕 Novo — Recém criado, validação em andamento  
- ⚠️ Legado — Funciona mas será depreciado

---

*Atualizado: 2026-02-09 - Kaixa Jr 🦊*
