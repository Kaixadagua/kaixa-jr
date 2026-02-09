# Melhoria 2026-02-09T19:32 - Logger Centralizado

**Tipo:** Local (backpressure ativo - 30 PRs abertos)  
**Branch:** improve/scripts-readme  
**Status:** ✅ Implementada

---

## 🎯 Objetivo

Criar sistema de logging estruturado e reutilizável para todos os scripts do Kaixa Jr, substituindo logs ad-hoc por uma solução profissional com rotação automática.

---

## 📝 O que foi feito

### Novo arquivo: `scripts/lib/logger.js`

Sistema completo de logging com:

| Feature | Descrição |
|---------|-----------|
| **Níveis** | DEBUG, INFO, WARN, ERROR, FATAL |
| **Cores** | Saída colorida no terminal (ANSI) |
| **JSONL** | Logs estruturados em JSON Lines |
| **Rotação** | Rotação automática por tamanho (10MB padrão) |
| **Buffer** | Buffer assíncrono com flush a cada 5s |
| **Child loggers** | Contexto herdado entre loggers |
| **Helpers** | `.start()`, `.success()`, `.fail()` para operações |

### Exemplo de uso:

```javascript
const { Logger } = require('./lib/logger');

const logger = new Logger({ name: 'guardian', level: 'INFO' });

logger.start('Health check');
logger.info('Agents running', { count: 2 });
logger.warn('High token usage', { tokens: 150000 });
logger.success('Health check');

// Child logger com contexto
const reqLogger = logger.child({ requestId: 'abc123' });
reqLogger.info('Processing request'); // Inclui requestId automaticamente
```

### Saída console:
```
[19:32:45] ℹ️ ▶️ Health check
[19:32:45] ℹ️ Agents running {count=2}
[19:32:45] ⚠️ High token usage {tokens=150000}
[19:32:45] ℹ️ ✅ Health check
```

### Saída arquivo (JSONL):
```jsonl
{"ts":"2026-02-09T19:32:45.123Z","level":"INFO","logger":"guardian","msg":"▶️ Health check","phase":"start"}
{"ts":"2026-02-09T19:32:45.145Z","level":"INFO","logger":"guardian","msg":"Agents running","count":2}
```

---

## 🎨 Benefícios

1. **Consistência** - Todos os scripts usam o mesmo formato
2. **Analisabilidade** - JSONL permite parsing automático
3. **Manutenibilidade** - Código de logging centralizado
4. **Performance** - Buffer assíncrono não bloqueia execução
5. **Rastreabilidade** - Child loggers propagam contexto

---

## 🔮 Próximos passos

Quando backpressure liberar:
- [ ] Refatorar `kaixa-guardian.js` para usar o novo logger
- [ ] Refatorar `git-safe.js` para usar o novo logger
- [ ] Criar dashboard de logs em `scripts/reports/`
- [ ] Adicionar métricas de log (taxa de erros, etc.)

---

🦊 Kaixa Jr - Melhoria contínua, sempre executando.
