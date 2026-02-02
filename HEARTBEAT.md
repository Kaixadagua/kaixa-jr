# HEARTBEAT.md - Melhoria Contínua (com Backpressure)

## Objetivo do Cron (5min)
**Buscar 1 melhoria no próprio sistema e implementar imediatamente.**

Se backpressure ativo (≥9 PRs abertos), fazer melhoria local/documentação sem novo PR.

## Escopo de Melhorias
- **Código:** Refactor, otimização, bugfixes, testes
- **Config:** Ajustes em openclaw.json, skills, workflows  
- **Documentação:** MEMORY.md, skills, comentários, consolidação
- **Skills:** Novas capabilities ou aprimoramento existentes
- **Workflows:** Scripts, automações, processos

## Ciclo (a cada 5min)
1. Verificar backpressure (`gh pr list | wc -l`)
2. Se < 9 PRs: Criar branch → implementar → commit → push → PR
3. Se ≥ 9 PRs: Melhoria local/documentação/consolidação
4. Registrar em `memory/improvements/`

## Validação
```bash
# Verificar melhorias aplicadas
ls memory/improvements/

# Verificar backpressure  
gh pr list --repo aura-io-saas/aurahub --state open | wc -l
```

## Regra de Ouro
**Nunca perguntar. Sempre executar.** 
Adaptar formato da melhoria ao contexto (PR se possível, local se necessário).

## Lições Aprendidas (2026-02-02)

### Taxas Sustentáveis
- **Ideal:** 6-8 PRs/hora (1 a cada 7-10 min)
- **Alcançado:** ~25 melhorias em ~138 min (~10.9/h)
- **Ajuste:** Backpressure funciona - adaptação automática mantém cadência

### Melhorias Locais Valem
Quando bloqueado por backlog:
- Documentação de processos
- Atualização de identidade (SOUL.md, IDENTITY.md)
- Criação de ferramentas utilitárias
- Consolidação de aprendizados

### Ferramentas Criadas
- `scripts/melhoria-status.js` - Métricas
- `scripts/health-check.js` - Saúde
- `status.bat` - Status rápido
- `memory/README.md` - Índice de navegação

---

_Melhoria contínua. Zero downtime. Always shipping._ 🦊
