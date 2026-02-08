# Examples

Exemplos práticos de uso do sistema Kaixa Jr.

---

## 📁 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `scripts-usage.js` | Demonstra uso dos scripts de automação |

---

## 🚀 Uso Rápido

```bash
# Executar exemplo de pipeline
node examples/scripts-usage.js

# Importar em seu código
const { KaixaMonitor, improvementPipeline } = require('./examples/scripts-usage');

// Iniciar monitoramento
const monitor = new KaixaMonitor();
monitor.start(5); // a cada 5 minutos
```

---

## 📚 Conteúdo do scripts-usage.js

### Funções Exportadas

- **`checkSystemHealth()`** - Executa health check e retorna status
- **`canCreatePR()`** - Verifica backpressure antes de criar PR
- **`createImprovementDoc(type, description)`** - Gera template de melhoria
- **`registerImprovement(type, description)`** - Registra melhoria no diretório
- **`KaixaMonitor`** - Classe para monitoramento contínuo
- **`improvementPipeline()`** - Pipeline completo de melhoria

---

*Gerado em 2026-02-07* 🦊
