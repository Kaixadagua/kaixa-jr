# Video Tutorials - Kaixa Jr

Tutoriais em formato de vídeo (transcrições) para aprender a usar o Kaixa Jr.

---

## 🎬 Tutorial 1: Primeiros Passos (5 min)

### Introdução
"Olá! Eu sou a Kaixa Jr, sua agente autônoma de melhoria contínua. Neste tutorial, vou mostrar como começar a usar o sistema em 5 minutos."

### Passo 1: Instalação (1 min)
```bash
# Clone o repositório
git clone https://github.com/kaixadagua/kaixa-jr.git
cd kaixa-jr

# Instale as dependências
npm install

# Verifique a instalação
kaixa version
```

**Saída esperada:**
```
🦊 kaixa-jr v1.0.0
```

### Passo 2: Configuração (2 min)
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas configurações
nano .env  # ou use seu editor preferido
```

**Configurações mínimas:**
```
OPENCLAW_GATEWAY_URL=http://localhost:8080
OPENCLAW_GATEWAY_TOKEN=seu_token
GITHUB_TOKEN=ghp_seu_token_github
```

### Passo 3: Validação (1 min)
```bash
# Valide a configuração
kaixa validate
```

**Saída esperada:**
```
🦊 Configuration Validation

✅ All required configuration is present.
```

### Passo 4: Health Check (1 min)
```bash
# Verifique a saúde do sistema
kaixa health
```

**Próximo passo:** Assista ao Tutorial 2 para aprender a fazer melhorias!

---

## 🎬 Tutorial 2: Sua Primeira Melhoria (8 min)

### Introdução
"Agora que você configurou o Kaixa Jr, vou mostrar como fazer sua primeira melhoria no sistema."

### Passo 1: Verificar Status (1 min)
```bash
kaixa status
```

**Interpretando a saída:**
- 📋 **Agent:** Nome e emoji configurados
- 📈 **Improvements:** Total de melhorias feitas
- ⚙️ **Configuration:** Se está válida
- 📁 **Repositories:** Caminhos configurados

### Passo 2: Executar uma Skill (2 min)
```bash
# Veja a progressão de melhorias
kaixa skill progress
```

**Saída esperada:**
```
🔄 Progressão Contínua

📊 Total de melhorias: 67
📅 Hoje: 0

📈 Por tipo:
  code: 45
  docs: 12
  config: 6
  infra: 4
```

### Passo 3: Gerar Código (3 min)
```bash
# Crie um novo sistema
kaixa generate system MeuSistema "Descrição do meu sistema"
```

**O que acontece:**
- Cria arquivo em `src/systems/meu-sistema.js`
- Template completo com JSDoc
- Pronto para implementar

### Passo 4: Verificar Git (2 min)
```bash
# Status do repositório
kaixa skill git
```

**Saída:**
```
📊 Git Readonly Status

Branch: improve/scripts-readme
Status: ⚠️ Has changes
Changes: 1 file(s)

Changed files:
  A src/systems/meu-sistema.js
```

**Próximo passo:** Tutorial 3 sobre Docker e deploy!

---

## 🎬 Tutorial 3: Docker e Deploy (10 min)

### Introdução
"Vou mostrar como containerizar o Kaixa Jr e fazer deploy em produção usando Docker."

### Passo 1: Build da Imagem (3 min)
```bash
# Construa a imagem Docker
npm run docker:build

# Ou manualmente:
docker build -t kaixa-jr:latest .
```

**Saída esperada:**
```
[+] Building 15.2s (12/12) FINISHED
 => => exporting to image
 => => naming to docker.io/library/kaixa-jr:latest
```

### Passo 2: Executar Container (2 min)
```bash
# Execute o container
npm run docker:run

# Ou com docker-compose:
npm run docker:compose
```

**Verificando se está rodando:**
```bash
docker ps | grep kaixa-jr
```

### Passo 3: Verificar Logs (2 min)
```bash
# Veja os logs
docker logs kaixa-jr -f
```

**Saída esperada:**
```
🦊 Kaixa Jr: Inicializando...
⚙️ ConfigManager: Configurações carregadas
🛡️ Error Handler: Ativo
✅ AgentCorp: Pronto!
```

### Passo 4: Deploy Script (3 min)
```bash
# Execute o script de deploy
./scripts/deploy.sh production
```

**O que o script faz:**
1. Valida configuração
2. Roda testes
3. Build da imagem
4. Para container antigo
5. Inicia novo container
6. Health check

---

## 🎬 Tutorial 4: Criando Skills (12 min)

### Introdução
"Vou ensinar como criar novas skills para estender as capacidades do Kaixa Jr."

### Passo 1: Estrutura de uma Skill (2 min)
```
skills/minha-skill/
├── SKILL.md          # Documentação
└── index.js          # Implementação
```

### Passo 2: Gerar Template (2 min)
```bash
kaixa generate skill MinhaSkill "Descrição da minha skill"
```

### Passo 3: Implementar (5 min)
```javascript
/**
 * Minha Skill
 * 
 * @module skills/minha-skill
 */

/**
 * Execute a skill
 * @returns {Object} Resultado
 */
function run() {
  console.log('🎯 Executando minha skill!');
  
  // Sua lógica aqui
  const result = {
    status: 'success',
    data: 'Resultado'
  };
  
  console.log('✅ Skill completada!');
  return result;
}

module.exports = { run };
```

### Passo 4: Testar (2 min)
```bash
# Execute a skill
kaixa skill minha
```

### Passo 5: Documentar (1 min)
Edite `skills/minha-skill/SKILL.md` com:
- Descrição
- Exemplos de uso
- API reference

---

## 🎬 Tutorial 5: Monitoramento Avançado (7 min)

### Introdução
"Vou mostrar como monitorar o sistema e interpretar métricas."

### Passo 1: Dashboard Web (2 min)
```bash
# Abra o dashboard
open dashboard/index.html
```

**O que você vê:**
- Status do sistema em tempo real
- Gráfico de melhorias
- Logs recentes
- Métricas de agentes

### Passo 2: Health Checks (2 min)
```bash
# Verifique saúde detalhada
kaixa skill health
```

**Interpretando resultados:**
- 🟢 **Saudável:** Tudo OK
- 🟡 **Warning:** Atenção necessária
- 🔴 **Critical:** Ação imediata

### Passo 3: Reports (2 min)
```bash
# Gere report de status
kaixa report
```

**Saída:**
```
🦊 Kaixa Jr Report

📊 Melhorias: 67
📈 Tendência: increasing
🔴 Backpressure: 12 PRs
```

### Passo 4: Guardian (1 min)
```bash
# Execute Guardian manualmente
npm run health
```

---

## 📚 Recursos Adicionais

### Documentação Completa
- [Architecture](../architecture/overview.md)
- [API Reference](../api/README.md)
- [Deployment](../guides/deployment.md)

### Comandos Úteis
```bash
# Lista todos os comandos
kaixa help

# Info específica
kaixa help skill

# Versão
kaixa version

# Validação
kaixa validate
```

### Suporte
- GitHub Issues: https://github.com/kaixadagua/kaixa-jr/issues
- Documentação: /docs

---

*Vídeos gravados em 2026-02-04*
*Kaixa Jr v1.0.2* 🦊
