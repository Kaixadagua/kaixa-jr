# 📊 Guardian Reports

Sistema de relatórios automatizados do **Kaixa Guardian** - o anti-crash protection system.

## Propósito

Esta pasta armazena relatórios JSON gerados automaticamente pelo Guardian em cada execução, fornecendo visibilidade sobre:

- Saúde das sessões ativas
- Uso de tokens
- Ações preventivas tomadas
- Histórico de performance

## Estrutura de Arquivos

```
scripts/reports/
├── guardian-YYYY-MM-DD.json    # Relatórios diários por data
└── README.md                   # Este arquivo
```

## Formato do Relatório

Cada entrada no relatório contém:

```json
{
  "timestamp": "2026-02-08T00:01:29.060Z",
  "agentCount": 2,
  "totalTokens": 187503,
  "status": "healthy",
  "action": null
}
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `timestamp` | string (ISO 8601) | Momento da coleta |
| `agentCount` | number | Sessões ativas no momento |
| `totalTokens` | number | Total de tokens em uso |
| `status` | string | `healthy`, `warning` ou `critical` |
| `action` | string \| null | Ação tomada (ex: `flush-context`) |

## Status

- **🟢 healthy**: Sistema operando normalmente
- **🟡 warning**: Próximo aos limites, ação preventiva pode ser tomada
- **🔴 critical**: Limite excedido, ação obrigatória executada

## Ações

| Ação | Descrição |
|------|-----------|
| `null` | Nenhuma ação necessária |
| `flush-context` | Contexto limpo para liberar tokens |
| `restart-session` | Sessão reiniciada devido a instabilidade |

## Frequência

Relatórios são gerados automaticamente pelo cron a cada **5 minutos**.

## Retenção

- Arquivos mais recentes: mantidos indefinidamente
- Arquivos antigos (> 30 dias): podem ser arquivados

---

*Gerado automaticamente pelo Kaixa Guardian* 🦊
