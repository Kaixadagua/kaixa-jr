# Deployment Guide

Guia completo de deploy do Kaixa Jr em diferentes ambientes.

---

## 📋 Pré-requisitos

- Node.js 18+
- Git
- Docker (opcional, para containerização)
- Acesso ao OpenClaw Gateway

---

## 🚀 Deploy Local

### 1. Clone o Repositório

```bash
git clone https://github.com/kaixadagua/kaixa-jr.git
cd kaixa-jr
```

### 2. Instale Dependências

```bash
npm install
```

### 3. Configure o Ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 4. Valide a Configuração

```bash
npm run validate
# ou
kaixa validate
```

### 5. Execute Health Check

```bash
npm run health
# ou
kaixa health
```

### 6. Inicie o Agent

```bash
npm start
```

---

## 🐳 Deploy com Docker

### 1. Build da Imagem

```bash
docker build -t kaixa-jr:latest .
```

### 2. Execute o Container

```bash
docker run -d \
  --name kaixa-jr \
  --restart unless-stopped \
  -v $(pwd)/memory:/app/memory \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/backups:/app/backups \
  kaixa-jr:latest
```

### 3. Ou Use Docker Compose

```bash
# Subir serviço
docker-compose up -d

# Ver logs
docker-compose logs -f kaixa-jr

# Parar serviço
docker-compose down
```

---

## ☁️ Deploy na Nuvem

### AWS EC2

1. **Crie uma instância EC2** (t2.micro ou superior)
2. **Instale Docker:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   ```
3. **Clone e deploy:**
   ```bash
   git clone https://github.com/kaixadagua/kaixa-jr.git
   cd kaixa-jr
   docker-compose up -d
   ```

### Google Cloud Run

1. **Build e push para GCR:**
   ```bash
   docker build -t gcr.io/PROJECT_ID/kaixa-jr .
   docker push gcr.io/PROJECT_ID/kaixa-jr
   ```

2. **Deploy no Cloud Run:**
   ```bash
   gcloud run deploy kaixa-jr \
     --image gcr.io/PROJECT_ID/kaixa-jr \
     --platform managed \
     --region us-central1
   ```

### Heroku

1. **Login e crie app:**
   ```bash
   heroku login
   heroku create kaixa-jr
   ```

2. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## 🔧 Configuração de Produção

### Variáveis de Ambiente Obrigatórias

```bash
# OpenClaw
OPENCLAW_GATEWAY_URL=https://gateway.openclaw.ai
OPENCLAW_GATEWAY_TOKEN=seu_token_aqui

# GitHub
GITHUB_TOKEN=ghp_seu_token
GITHUB_USERNAME=kaixadagua

# Agent
AGENT_NAME=Kaixa Jr
AGENT_MAX_CONCURRENT=1

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### Configuração de Cron Jobs

Configure os cron jobs no sistema host:

```bash
# Edite crontab
crontab -e

# Adicione:
*/5 * * * * cd /path/to/kaixa-jr && node scripts/health/kaixa-guardian.js
*/35 * * * * cd /path/to/kaixa-jr && node scripts/reports/kaixa-report-35min.js
```

Ou use o cron do OpenClaw (recomendado):

```bash
openclaw cron add --name guardian --every 5m --script scripts/health/kaixa-guardian.js
```

---

## 📊 Monitoramento

### Health Checks

O sistema possui health checks automáticos via:

- **Kaixa Guardian** (a cada 5 minutos)
- **Docker Health Check** (a cada 30 segundos)

### Logs

```bash
# Ver logs do container
docker logs kaixa-jr -f

# Ver logs do sistema
npm run logs
# ou
tail -f logs/kaixa.log
```

### Métricas

Execute o report de status:

```bash
kaixa report
```

---

## 🔄 Atualização

### Atualização Local

```bash
git pull origin main
npm install
npm test
npm restart
```

### Atualização Docker

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 🛡️ Segurança

### Boas Práticas

1. **Nunca commite o `.env`**
2. **Use tokens com escopo mínimo necessário**
3. **Rotacione tokens periodicamente**
4. **Monitore logs para atividades suspeitas**

### Firewall

```bash
# Permitir apenas acesso necessário
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw enable
```

---

## 🆘 Troubleshooting

### Problema: Agent não inicia

**Solução:**
```bash
# Verifique logs
npm run logs

# Valide configuração
kaixa validate

# Verifique permissões
ls -la memory/ logs/ backups/
```

### Problema: Docker container reinicia

**Solução:**
```bash
# Verifique logs
docker logs kaixa-jr

# Verifique health check
docker inspect kaixa-jr | grep -A 10 Health
```

### Problema: Alto uso de memória

**Solução:**
```bash
# Execute context compactor
node scripts/systems/context-compactor.js

# Ou limpe manualmente
rm -rf memory/cron-snapshots/*.md
```

---

## 📞 Suporte

Em caso de problemas:

1. Verifique [Issues no GitHub](https://github.com/kaixadagua/kaixa-jr/issues)
2. Consulte [Documentação](../architecture/overview.md)
3. Execute `kaixa health` para diagnóstico

---

*Última atualização: 2026-02-04*
