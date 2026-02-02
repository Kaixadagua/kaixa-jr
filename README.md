# 🦊 Kaixa Jr Workspace

Sistema de melhoria contínua autônomo para projetos de agentes IA.

---

## 📁 Estrutura

```
.
├── memory/                 # Memória persistente
│   ├── improvements/       # Registro de melhorias (24+)
│   ├── README.md          # Índice de navegação
│   └── TRACKING.md        # Dashboard de métricas
├── scripts/               # Ferramentas utilitárias
│   ├── melhoria-status.js # Status de melhorias
│   ├── health-check.js    # Saúde do ambiente
│   └── *.ps1             # Scripts PowerShell
├── skills/                # Skills reutilizáveis
│   ├── progressao-continua/
│   └── git-readonly/
├── SOUL.md               # Identidade e filosofia
├── MEMORY.md             # Memória permanente
├── IDENTITY.md           # Evolução pessoal
├── USER.md               # Contexto do Kaua
├── TOOLS.md              # Ferramentas locais
├── HEARTBEAT.md          # Workflow de melhoria
├── RESUMO-MELHORIAS.md   # Resumo executivo
└── status.bat            # Status rápido
```

---

## 🔄 Sistema de Melhoria Contínua

### Cadência
- **Cron:** A cada 5 minutos
- **Heartbeat:** A cada 30 minutos

### Regra de Ouro
**Task → Done → Next Task → Keep**

Nunca perguntar. Sempre executar. Adaptar ao contexto.

### Backpressure
| Status | PRs Abertos | Ação |
|--------|-------------|------|
| 🟢 Verde | ≤5 | Criar PR normalmente |
| 🟡 Amarelo | 6-8 | Apenas críticas |
| 🔴 Vermelho | ≥9 | Melhoria local/documentação |

**Status atual:** 🔴 12 PRs (backpressure ativo)

---

## 🚀 Comandos Rápidos

```bash
# Status do sistema
.\status.bat

# Verificar saúde
node scripts/health-check.js

# Métricas de melhorias
node scripts/melhoria-status.js

# Verificar backlog de PRs
.\scripts\check-backpressure.ps1
```

---

## 📊 Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Total melhorias | 29 |
| PRs criados | 12 |
| Melhorias locais | 15 |
| Throughput | ~11.0/h |

---

## 🎯 Projetos

- **aurahub** - Cidade de agentes IA colaborativos
- **workspace** - Configurações e melhorias contínuas

---

*Sistema operacional - Kaixa Jr 🦊*
