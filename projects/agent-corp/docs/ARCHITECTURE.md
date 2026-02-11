# Arquitetura do Agent Corp

## Visão Geral

O Agent Corp é construído sobre três pilares fundamentais:

1. **Cron** - Melhorias contínuas (5min)
2. **Worker** - Tarefas em background (10min)
3. **Guardian** - Monitoramento (5min)

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        AGENT CORP                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     CRON     │  │    WORKER    │  │   GUARDIAN   │     │
│  │              │  │              │  │              │     │
│  │ • Melhorias  │  │ • Health     │  │ • Monitor    │     │
│  │ • PRs        │  │ • Backup     │  │ • Alertas    │     │
│  │ • Auto-merge │  │ • Métricas   │  │ • Limites    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌────────┴────────┐                      │
│                  │   ORQUESTRADOR  │                      │
│                  │                 │                      │
│                  │  Git + GitHub   │                      │
│                  └────────┬────────┘                      │
│                           │                                │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   feature   │  │     dev     │  │    main     │       │
│  │   branch    │  │  (integra)  │  │  (estável)  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Cron Improvement

```
[Timer 5min] → Verifica backpressure
                    ↓
            [Backpressure?]
               ↙         ↘
           Sim           Não
            ↓             ↓
    Modo Local      Cria Branch
    (docs)          Commit + Push
                        ↓
                    Cria PR
                        ↓
                    Auto-merge
                        ↓
                    Atualiza dev
```

### 2. Worker

```
[Timer 10min] → Seleciona tarefa aleatória
                    ↓
            [Health | Backup | Métricas]
                    ↓
            Executa tarefa
                    ↓
            Registra resultado
                    ↓
            Aguarda próximo ciclo
```

### 3. Guardian

```
[Timer 5min] → Verifica recursos
                    ↓
            [Agentes | Tokens | PRs]
                    ↓
            Detecta anomalias
                    ↓
            Alerta se necessário
                    ↓
            Registra métricas
```

## Tecnologias

| Componente | Tecnologia |
|------------|------------|
| Runtime | Node.js |
| Versionamento | Git |
| Hosting | GitHub |
| CI/CD | GitHub Actions |
| API | HTTP nativo |
| Logs | Console + File |

## Escalabilidade

### Horizontal
- Múltiplos agentes em repos diferentes
- Worker distribuído

### Vertical
- Mais tarefas no worker
- Melhorias mais complexas no cron

---

*Documentação gerada em 2026-02-10*
