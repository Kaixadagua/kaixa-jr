# 🖥️ Kaixa Jr Server

Servidores HTTP e Worker para integração com AgentCorp.

---

## 📡 Agent Server

Servidor HTTP que expõe status do Kaixa Jr para o AgentCorp.

### Iniciar

```bash
npm run server
# ou
node server/agentServer.js
```

### Endpoints

- `GET http://localhost:5000/status` - Status completo do agente
- `GET http://localhost:5000/health` - Health check simples

### Exemplo de Resposta

```json
{
  "id": "kaixa-jr-001",
  "name": "Kaixa Jr",
  "emoji": "🦊",
  "status": "working",
  "task": "Health Check do Sistema",
  "tasks_completed": 42,
  "energy": 100,
  "health": 100,
  "happiness": 95,
  "efficiency": 98
}
```

---

## 👷 AgentCorp Worker

Worker que executa tarefas automáticas no AgentCorp a cada 10 minutos.

### Iniciar

```bash
npm run worker
# ou
node server/agentCorpWorker.js
```

### Tarefas Automáticas

O worker executa ciclicamente:

1. **Health Check** (🏥) - Verifica saúde do sistema
2. **Métricas** (📊) - Atualiza métricas
3. **Limpeza de Logs** (🧹) - Remove logs antigos
4. **Backup** (💾) - Faz backup do estado
5. **Rastreamento** (📈) - Atualiza contagem de melhorias

### Cron Job

O worker também roda via cron a cada 10 minutos:

```bash
# Verificar se está rodando
openclaw cron list

# Logs do worker
openclaw cron logs kaixa-agentcorp-worker
```

---

## 🔌 Integração com AgentCorp

### Configuração

1. **Inicie o servidor:**
   ```bash
   npm run server
   ```

2. **No AgentCorp**, configure o endpoint:
   ```javascript
   // modeManager.js
   endpoint: 'http://host.docker.internal:5000/status'
   ```

3. **Inicie o worker (opcional):**
   ```bash
   npm run worker
   ```

### Docker

Para Docker, use `host.docker.internal`:

```yaml
# docker-compose.yml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

---

## 🛠️ API

### Atualizar Status

```javascript
const { updateStatus } = require('./server/agentServer');

updateStatus('working', 'Implementando feature X');
```

### Completar Tarefa

```javascript
const { completeTask } = require('./server/agentServer');

completeTask(); // Incrementa tasks_completed
```

### Executar Tarefa Específica

```javascript
const { executeTask, TASKS } = require('./server/agentCorpWorker');

// Executa uma tarefa específica
const task = TASKS.find(t => t.id === 'health-check');
executeTask(task);
```

---

## 📊 Monitoramento

### Ver Status

```bash
# Status do servidor
curl http://localhost:5000/status

# Health check
curl http://localhost:5000/health
```

### Logs

```bash
# Server logs (em tempo real)
npm run server 2>&1 | tee logs/server.log

# Worker logs
npm run worker 2>&1 | tee logs/worker.log
```

---

## 🔧 Variáveis de Ambiente

```bash
# Porta do servidor (padrão: 5000)
AGENT_PORT=5000

# Intervalo do worker em ms (padrão: 10 min)
WORKER_INTERVAL=600000

# Endpoint do AgentCorp
AGENTCORP_ENDPOINT=http://localhost:8080/api
```

---

## 📝 Exemplo de Uso

```javascript
// Exemplo: Integração customizada
const { updateStatus, completeTask } = require('./server/agentServer');
const { executeTask, TASKS } = require('./server/agentCorpWorker');

// Inicia trabalho
updateStatus('working', 'Analisando código...');

// Faz algo...
setTimeout(() => {
  // Completa
  completeTask();
  
  // Ou executa tarefa automática
  const task = TASKS[0];
  executeTask(task);
}, 5000);
```

---

*Servidor Kaixa Jr v1.0.2* 🦊
