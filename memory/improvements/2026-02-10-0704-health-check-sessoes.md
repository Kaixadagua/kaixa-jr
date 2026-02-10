# Melhoria 2026-02-10-0704

## Tipo
Local (backpressure ativo - 12 PRs)

## Descrição
Adicionadas verificações de sessões ativas e cron jobs ao health-check.js

## Alterações
- scripts/health-check.js: Adicionado parsing de `openclaw status --json`
- Contagem de sessões: ativas, cron, usuário
- Detecção de sessões longas (>30min)
- Verificação de cron jobs ativos

## Motivação
Maior visibilidade do estado do sistema durante health checks

## Status
✅ Aplicado localmente
