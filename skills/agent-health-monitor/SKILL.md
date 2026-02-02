# Agent Health Monitor

Sistema de monitoramento e gestão saudável de agentes para OpenClaw.

## Propósito

Evitar perda de performance ao criar múltiplos agentes, mantendo o sistema operando de forma saudável e sustentável.

## Princípios

1. **Limite Rígido**: Máximo 1 agente ativo por padrão
2. **Monitoramento Contínuo**: Tokens, memória, tempo de resposta
3. **Ação Proativa**: Alertas antes de problemas
4. **Recuperação Automática**: Flush quando necessário
5. **Backpressure Inteligente**: Adaptação automática à carga

## Configurações

```json
{
  "maxConcurrentAgents": 1,
  "maxTokensPerSession": 180000,
  "warningThreshold": 150000,
  "autoFlush": true,
  "flushThreshold": 200000
}
```

## Uso

```bash
# Verificar saúde do sistema de agentes
node scripts/agent-guardian.js

# Output exemplo:
# 🦊 Agent Guardian - Gestão Saudável
# ─────────────────────────────────────
# 📊 Agentes: 1/1
# 💾 Tokens: 45k/180k
# 📈 Status: HEALTHY
# ✅ Sistema saudável
```

## Quando Criar Novos Agentes

✅ **Pode criar**:
- Tarefas independentes que não compartilham contexto
- Processamento paralelo de dados
- Tarefas de longa duração que podem rodar em background

❌ **Não criar**:
- Tarefas que precisam de contexto compartilhado
- Quando tokens > 150k
- Quando já há 1 agente ativo

## Estratégia de 1 Agente

O agente principal (Kaixa Jr) atua como:
- **Executor principal**: Todas as tarefas prioritárias
- **Coordenador**: Decide quando spawnar sub-agentes
- **Co-ajudante**: Auxilia em tarefas complexas de programação

## Recuperação

Se o sistema detectar sobrecarga:
1. Alerta visual (🟡 warning)
2. Sugestão de flush (/compact)
3. Auto-flush se configurado
4. Cooldown antes de novos agentes

---
*Sistema de gestão saudável de agentes 🦊*
