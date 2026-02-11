# Agent Corp - Sistema de Agentes Autônomos

> 🦊 **Kaixa Jr Enterprise** - Fluxo contínuo de melhorias via cron

---

## Visão Geral

O **Agent Corp** é um sistema de agentes de IA autônomos projetado para operar em modo contínuo, realizando melhorias incrementais em código, documentação e infraestrutura sem intervenção humana.

### Filosofia

```
Task → Done → Next Task → Keep
```

**Zero downtime. Always shipping.**

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT CORP v1.0                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CRON      │  │  WORKER     │  │  GUARDIAN   │        │
│  │  (5min)     │  │  (10min)    │  │  (monitor)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │               │
│         ▼                ▼                ▼               │
│  ┌─────────────────────────────────────────────────┐     │
│  │           ORQUESTRADOR CENTRAL                  │     │
│  │         (Git + GitHub + Scripts)               │     │
│  └─────────────────────────────────────────────────┘     │
│                          │                                │
│         ┌────────────────┼────────────────┐              │
│         ▼                ▼                ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   FEATURE   │  │    DEV      │  │    MAIN     │      │
│  │  (branch)   │  │  (integração)│  │  (estável)  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow de Desenvolvimento

### 1. Feature Branch → Dev (Auto-Merge)

```bash
# A cada 5 minutos
feature/cron-improvement-<timestamp>
    ↓
commit + push
    ↓
PR #XXX criado automaticamente
    ↓
[auto-merge sem aprovação humana]
    ↓
dev (integrado)
```

### 2. Dev → Main (Semanal)

```bash
# Após 1 semana de estabilidade
dev
    ↓
[merge manual ou auto-merge programado]
    ↓
main (estável)
```

---

## Componentes

### 🤖 Cron Improvement (5min)

**Arquivo:** `scripts/cron-improvement.js`

**Responsabilidades:**
- Verificar backpressure (threshold: 50 PRs)
- Sugerir melhoria (código ou documentação)
- Criar branch a partir do `dev`
- Commit + Push
- Abrir PR
- Auto-merge

**Modos de Operação:**

| Modo | Condição | Ação |
|------|----------|------|
| PR | < 50 PRs abertos | Cria branch → commit → push → PR → auto-merge |
| Local | ≥ 50 PRs abertos | Documentação local sem novo PR |

### 🏭 Worker AgentCorp (10min)

**Arquivo:** `server/agentCorpWorker.js`

**Tarefas:**
- Health Check do Sistema
- Atualização de Métricas
- Limpeza de Logs Antigos
- Backup do Estado
- Rastreamento de Melhorias
- Geração de Melhoria de Código

### 🦊 Kaixa Guardian (5min)

**Arquivo:** `scripts/kaixa-guardian.js`

**Monitoramento:**
- Agentes ativos (máx: 2)
- Consumo de tokens (máx: 360k)
- Backpressure de PRs
- Sessões do sistema

---

## Estrutura de Diretórios

```
agent-corp/
├── 📁 .github/
│   └── workflows/           # GitHub Actions
│       └── auto-merge.yml
├── 📁 scripts/
│   ├── cron-improvement.js  # Cron principal
│   ├── kaixa-guardian.js    # Monitoramento
│   ├── health-check.js      # Verificação de saúde
│   └── lib/                 # Bibliotecas compartilhadas
│       └── logger.js
├── 📁 server/
│   ├── agentCorpWorker.js   # Worker background
│   └── api/                 # API endpoints
│       └── health.js
├── 📁 memory/
│   ├── improvements/        # Registro de melhorias
│   ├── reports/             # Relatórios periódicos
│   └── heartbeat-state.json # Estado operacional
├── 📁 docs/
│   ├── ARCHITECTURE.md      # Arquitetura detalhada
│   ├── WORKFLOW.md          # Fluxo de trabalho
│   └── API.md               # Documentação da API
├── 📄 KIMI.md               # Este arquivo
├── 📄 .KIMI                 # Configurações
├── 📄 package.json
└── 📄 README.md
```

---

## Métricas e KPIs

### Taxas Sustentáveis

| Métrica | Ideal | Alcançado |
|---------|-------|-----------|
| Melhorias/hora | 6-8 | ~10 |
| Tempo por melhoria | 7-10 min | ~5 min |
| PRs/hora | 6-8 | ~10 |
| Uptime | 100% | 100% |

### Backpressure

```yaml
thresholds:
  green: 0-20 PRs   # Modo normal
  yellow: 21-35 PRs # Atenção
  red: 36-50 PRs    # Modo local
  critical: 50+ PRs # Documentação apenas
```

---

## Configurações

### Git

```bash
# Branch principal
git checkout dev

# Merge automático habilitado
gh pr merge <number> --squash --delete-branch --admin
```

### Cron

```cron
# A cada 5 minutos
*/5 * * * * node scripts/cron-improvement.js

# A cada 10 minutos
*/10 * * * * node server/agentCorpWorker.js

# Heartbeat a cada 1 minuto (recomendado)
* * * * * node scripts/kaixa-guardian.js --silent
```

---

## Segurança

### Permissões

- ✅ Auto-merge: **Ativado** (bypass de aprovação)
- ✅ Branch protection: **Desativado** para `dev`
- ✅ Admin merge: **Permitido**
- ✅ Force push: **Permitido** em branches de feature

### Secrets

```env
GITHUB_TOKEN=<token-com-permissões-de-escrita>
GH_REPO=Kaixadagua/kaixa-jr
```

---

## Resiliência

### Fallbacks

1. **Git indisponível:** Melhoria local em documentação
2. **GitHub API falha:** Retry com exponential backoff (3 tentativas)
3. **Backpressure crítico:** Modo local até liberar
4. **Erro de merge:** Fechar PR e documentar local

### Recuperação

```javascript
// Se PR falha, documenta local
if (!prCreated) {
  documentLocal(improvement);
  return { mode: 'local', success: true };
}
```

---

## Comandos Úteis

```bash
# Verificar status
git status
gh pr list --state open

# Limpar branches antigas
git branch --merged | xargs git branch -d

# Ver logs do worker
process log <session-id>

# Forçar melhoria manual
node scripts/cron-improvement.js
```

---

## Roadmap

### v1.0 (Atual)
- ✅ Cron de melhorias
- ✅ Auto-merge
- ✅ Worker background
- ✅ Guardian monitoring

### v1.1 (Próximo)
- 🔄 Multi-agente suporte
- 🔄 Dashboard web em tempo real
- 🔄 Integração com Discord/Slack
- 🔄 Métricas exportáveis (Prometheus)

### v2.0 (Futuro)
- 🔮 ML para sugestão de melhorias
- 🔮 Auto-correção de bugs detectados
- 🔮 Integração com CI/CD externos
- 🔮 Cluster de agentes

---

## Licença

MIT License - Kaixa Jr 🦊

---

*Documentação gerada em 2026-02-10*
*Última atualização: 2026-02-10*
