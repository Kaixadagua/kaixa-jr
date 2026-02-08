# Melhoria: Fix Falso Positivo Agentes

**Data:** 2026-02-07 21:36  
**Tipo:** Código (Bugfix)  
**Arquivo:** `scripts/kaixa-guardian.js`  
**Status:** ✅ Commitado (backpressure ativo)

---

## Problema

O `kaixa-guardian.js` reportava incorretamente "2/2 agentes" quando havia apenas:
- 1 sessão principal (main) 
- 1 subagente real

Isso acontecia porque o script contava **todas** as sessões não-cron como agentes, em vez de filtrar apenas `kind: "subagent"`.

## Solução

Adicionado filtro explícito por `s.kind === 'subagent'`:

```javascript
// Antes: contava tudo
status.sessions.forEach(s => {
    if (isCronSession(s.key)) return;
    agentCount++;  // ❌ Contava main como agente
});

// Depois: filtra corretamente
status.sessions.forEach(s => {
    if (isCronSession(s.key)) return;
    if (s.kind !== 'subagent') {
        systemCount++;  // ✅ Track separado
        return;
    }
    agentCount++;  // ✅ Só subagentes reais
});
```

## Melhorias Adicionais

- Nova métrica: `systemCount` (sessões de sistema ignoradas)
- Output mostra quantas sessões de sistema foram filtradas
- Header atualizado com documentação do fix

## Validação

```bash
node scripts/kaixa-guardian.js
# Antes: "Agentes: 2/2" (errado)
# Depois: "Agentes: 0/2" + "Sessões sistema: 1" (correto quando só há main)
```

---

*Backpressure ativo (12 PRs). Melhoria commitada localmente.* 🦊
