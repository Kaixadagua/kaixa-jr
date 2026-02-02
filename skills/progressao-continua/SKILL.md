# SKILL.md - Progressão Contínua Resiliente

## Problema

Agentes autônomos precisam manter progresso contínuo mesmo quando enfrentam obstáculos. Barreiras comuns impedem o fluxo Task → Done → Next Task.

## Barreiras Identificadas

### 1. Permissões e Acesso
**Sintoma:** 403 Forbidden, "Permission denied"
**Causa:** Token expirado, sem acesso de write, repo movido
**Solução:**
- Verificar `gh auth status` imediatamente
- Testar permissão com `gh repo view --json viewerPermission`
- Se READ-only: notificar usuário com instruções claras
- Fallback: trabalhar localmente, criar patch files

### 2. Network/Timeout
**Sintoma:** `dial tcp: connectex: A connection attempt failed`
**Causa:** Instabilidade de rede, API rate limit
**Solução:**
- Retry com backoff exponencial (1s, 2s, 4s)
- Cache resultados localmente quando possível
- Usar `--offline` mode para git operations
- Fallback: trabalho local, sincroniza depois

### 3. Sub-agente Falha/Sem Output
**Sintoma:** Background task completa mas sem entregáveis
**Causa:** Timeout, erro silencioso, loop infinito
**Solução:**
- Sempre verificar `sessions_history` após spawn
- Se falha: assumir execução imediatamente
- Nunca depender 100% de sub-agente para tasks críticas
- Fallback: executar diretamente no main

### 4. Contexto Cheio/Lotado
**Sintoma:** Modelo retorna erro de contexto, respostas truncadas
**Causa:** Muitas mensagens, arquivos grandes lidos
**Solução:**
- Flush para `memory/YYYY-MM-DD.md` imediatamente
- Usar `offset`/`limit` em reads grandes
- Preferir `exec` com grep ao invés de ler arquivos inteiros
- Checkpoint após cada task major

### 5. Dependências Bloqueantes
**Sintoma:** Precisa de input usuário, confirmação, credenciais
**Causa:** Workflow não é 100% autônomo
**Solução:**
- Antecipar necessidades (pre-fetch credenciais)
- Criar tasks que não precisam de input (fallbacks)
- Documentar blockers em `memory/blockers.md`
- Sugerir automações para Kaua configurar

### 6. Backpressure (Muitos PRs Abertos)
**Sintoma:** Backlog de PRs crescendo rápido demais, reviewer não consegue acompanhar
**Causa:** Taxa de produção > Taxa de revisão
**Solução:**
- Implementar thresholds: 🟢≤5 🟡6-8 🔴≥9 PRs
- Quando 🔴: Fazer melhorias locais/documentação (sem novo PR)
- Criar sistema de tracking: `memory/improvements/TRACKING.md`
- Taxa sustentável: ~6-8 PRs/hora (1 a cada 7-10 min)

## Padrões de Resiliência

### Retry Pattern
```
Tentativa 1 → Falha → Espera 1s → Tentativa 2
Tentativa 2 → Falha → Espera 2s → Tentativa 3
Tentativa 3 → Falha → Fallback manual
```

### Fallback Hierarchy
1. **Automático:** Sub-agente paralelo
2. **Semi-auto:** Execução main com prompts mínimos
3. **Manual:** Notificar usuário com contexto completo
4. **Documentar:** Registrar blocker para futuro

### Checkpoint Strategy
- Após cada task: `git status`, `sessions_list`
- A cada 30 min: flush contexto
- Antes de retry: salvar estado atual
- Após erro: dump para `memory/emergency-dump.md`

## Comandos Úteis

```bash
# Verificar saúde do ambiente
gh auth status
openclaw status 2>/dev/null || echo "OpenClaw OK"

# Cache local
git stash list
ls memory/ 2>/dev/null || mkdir memory

# Estado do sistema
df -h .  # disco
git status --short  # changes pendentes
```

## Metáfora

> "Um rio não para quando encontra uma rocha. Ele contorna, salta, ou cavouca até passar. Se não conseguir passar, ele cria um lago novo e continua crescendo."

## Checklist de Progresso Contínuo

- [ ] Sempre ter fallback task pronta
- [ ] Verificar permissões antes de push
- [ ] Testar sub-agente em tasks não-críticas primeiro
- [ ] Cache de resultados quando possível
- [ ] Documentar blockers para Kaua resolver
- [ ] Flush contexto a cada 30 min
- [ ] Retry automático com backoff
- [ ] Modo offline sempre disponível
- [ ] **Verificar backpressure antes de novo PR**

## Sistema de Backpressure

### Thresholds
| Status | PRs Abertos | Ação Recomendada |
|--------|-------------|------------------|
| 🟢 Verde | ≤5 | Criar PR normalmente |
| 🟡 Amarelo | 6-8 | Apenas melhorias críticas |
| 🔴 Vermelho | ≥9 | Melhoria local/documentação |

### Implementação
```powershell
# Script de verificação
$prs = gh pr list --repo owner/repo --state open | Measure-Object
if ($prs.Count -ge 9) {
    # Fazer melhoria local, sem novo PR
} else {
    # Prosseguir com PR
}
```

### Aprendizado
- Taxa sustentável: ~6-8 PRs/hora (1 a cada 7-10 min)
- Acima disso: reviewer não consegue acompanhar
- Solução: melhorias locais mantêm cadência sem sobrecarregar

---

*Atualizado: 2026-02-02 - Adicionado backpressure*
*Criado por aprendizado contínuo. Atualizar quando novas barreiras forem encontradas.* 🦊
