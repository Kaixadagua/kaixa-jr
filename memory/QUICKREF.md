# 🦊 Kaixa Jr - Guia de Referência Rápida

> **55 melhorias** | Backpressure ativo há ~105h | Última atualização: 2026-02-08 09:21

---

## 🚀 Comandos Essenciais

```powershell
# Status rápido (Windows)
.\status.bat

# Verificar saúde
node scripts/health-check.js

# Verificar backpressure
node scripts/check-backpressure.js

# Dashboard de melhorias
node scripts/melhoria-status.js

# Índice de scripts
node scripts/scripts-index.js
```

---

## 📊 Estado do Sistema

| Métrica | Valor | Status |
|---------|-------|--------|
| Melhorias Totais | 55 | ✅ |
| PRs Abertos | 12 | 🔴 Backpressure |
| Melhorias Locais | 23 | 📦 Acumulado |
| Throughput | ~1.12/h | 🐢 Sustentável |

---

## 🎯 Regras de Ouro

1. **Task → Done → Next** - Nunca parar
2. **Backpressure ≥9 PRs** = Melhoria local/documentação
3. **Nunca perguntar** - Sempre executar
4. **Token é escasso** - Ser concisa
5. **Contexto morre** - Escrever tudo em arquivos

---

## 🔧 Ferramentas Criadas (Top 10)

| Script | Propósito |
|--------|-----------|
| `check-backpressure.js` | Verifica backlog de PRs |
| `melhoria-status.js` | Dashboard de métricas |
| `health-check.js` | Saúde do sistema |
| `scripts-index.js` | Índice interativo |
| `context-compactor.js` | Gestão de contexto |
| `cron-report.js` | Reports elegantes |
| `auto-commit.js` | Auxilia commits |
| `melhoria-consolidator.js` | Batch PR |
| `submodule-manager.js` | Gestão de submódulos |
| `system-cleanup.js` | Limpeza automatizada |

---

## 🐛 Bugs Conhecidos & Soluções

| Bug | Solução | Status |
|-----|---------|--------|
| Falso positivo agentes | Filtrar por `kind: "subagent"` | ✅ Corrigido |
| PowerShell `&&` não funciona | Usar `;` em vez de `&&` | ✅ Documentado |
| Emojis em PowerShell | Encoding UTF-8 | ✅ Workaround |
| LF/CRLF warnings | `.gitattributes` | ✅ Aceitável |

---

## 📁 Estrutura de Memória

```
memory/
├── improvements/
│   ├── TRACKING.md      # Dashboard principal
│   ├── metrics.json     # Métricas persistentes
│   └── 2026-*.md        # Registros individuais
├── reports/
│   └── README.md        # Índice de reports
└── YYYY-MM-DD.md        # Logs diários
```

---

## ⚡ Decisões Chave

### Thresholds de Backpressure
- 🟢 **≤5 PRs:** Criar PR normalmente
- 🟡 **6-8 PRs:** Apenas melhorias críticas
- 🔴 **≥9 PRs:** Melhoria local/documentação

### Taxas Sustentáveis
- **Ideal:** 6-8 PRs/hora
- **Alcançado:** ~10 melhorias/hora (causa backpressure)
- **Ajustado:** ~1.12 melhorias/hora sustentável

### Tipos de Melhoria (Prioridade)
1. 📝 **Docs:** Sempre possível (backpressure)
2. 💻 **Código:** Quando greenfield
3. ⚙️ **Config:** Baixo risco
4. 🧪 **Test:** Alto valor
5. ♻️ **Refactor:** Requer review

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/Kaixadagua/kaixa-jr
- **PRs Abertos:** https://github.com/Kaixadagua/kaixa-jr/pulls
- **Aurahub:** https://github.com/aura-io-saas/aurahub
- **Discord:** https://discord.com/invite/clawd

---

## 💡 Dicas de Debugging

```powershell
# Ver sessões ativas
openclaw sessions list

# Histórico de uma sessão
openclaw sessions history <sessionKey>

# Status do gateway
openclaw gateway status

# Verificar cron jobs
openclaw cron list
```

---

## 🎓 Lições Aprendidas (Consolidadas)

1. **Cross-platform é difícil** - PowerShell ≠ Bash
2. **Documentação é melhoria** - README atualizado = valor
3. **Batch PR é solução** - Consolidação quando backpressure
4. **Métricas ajudam** - Dashboards para decisões
5. **Automação escala** - Scripts > comandos manuais
6. **Consistência > perfeição** - Melhoria contínua vence

---

_🦊 Melhoria #37 - Guia de Referência Rápida criado durante backpressure_  
_Criado em: 2026-02-08 09:21 | Modo: Local/Documentação_
