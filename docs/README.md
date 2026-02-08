# 📚 Kaixa Jr - Documentação

> *"Código é expressão. Não escrevo para máquinas, escrevo para humanos que virão depois."* — Kaixa Jr 🦊

---

## 🎯 O que é Kaixa Jr?

**Kaixa Jr** é uma IA construtora de projetos valorosos à base de código. Um sistema de agente autônomo projetado para:

- **Progressão Contínua**: Task → Done → Next Task → Keep
- **Resiliência Total**: Adaptação automática a bloqueios
- **Autonomia Completa**: Zero perguntas, sempre executando
- **Melhoria Constante**: Cadência de 1 melhoria a cada 5 minutos

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    KAIXA JR SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   CRON      │  │  HEARTBEAT  │  │   MAIN SESSION      │ │
│  │  (5 min)    │  │  (30 min)   │  │  (Telegram/Discord) │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          ▼                                 │
│              ┌─────────────────────┐                       │
│              │  continuousImprovement.js                   │ │
│              │  - Busca melhorias  │                       │
│              │  - Executa tarefas  │                       │
│              └──────────┬──────────┘                       │
│                         ▼                                  │
│         ┌───────────────────────────────┐                  │
│         │    DECISÃO: Backpressure?     │                  │
│         └───────────────┬───────────────┘                  │
│                         │                                  │
│           ┌─────────────┼─────────────┐                    │
│           ▼             ▼             ▼                    │
│        [≤5 PRs]     [6-8 PRs]     [≥9 PRs]                 │
│        🟢 GREEN     🟡 YELLOW     🔴 RED                   │
│           │             │             │                    │
│           ▼             ▼             ▼                    │
│        Criar PR    PR Crítico    Melhoria Local            │
│                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Workspace

```
workspace/
├── 📄 AGENTS.md          # Configuração de agentes (max 2)
├── 📄 BOOTSTRAP.md       # Certificado de nascimento (first run)
├── 📄 HEARTBEAT.md       # Checklist de verificações periódicas
├── 📄 IDENTITY.md        # Quem sou eu (evolução)
├── 📄 MEMORY.md          # Memória de longo prazo
├── 📄 SOUL.md            # Essência e princípios
├── 📄 TOOLS.md           # Notas locais de ferramentas
├── 📄 USER.md            # Quem é meu humano (Kaua)
│
├── 📂 docs/              # Documentação do projeto
│   └── README.md         # Você está aqui
│
├── 📂 memory/            # Memória persistente
│   ├── improvements/     # Registro de melhorias (52+)
│   ├── reports/          # Reports do guardian
│   └── YYYY-MM-DD.md     # Logs diários
│
├── 📂 scripts/           # Ferramentas utilitárias
│   ├── health/           # Health checks
│   ├── reports/          # Geração de relatórios
│   ├── sync/             # Sincronização
│   ├── *.js              # Scripts Node.js
│   ├── *.ps1             # Scripts PowerShell
│   └── *.bat             # Scripts Batch
│
├── 📂 skills/            # Skills reutilizáveis
│   ├── progressao-continua/
│   └── git-readonly/
│
├── 📂 server/            # Servidor e lógica principal
│   └── continuousImprovement.js
│
└── 📄 openclaw.json      # Configuração do OpenClaw
```

---

## 🔄 Fluxo de Melhoria Contínua

### Ciclo de 5 Minutos (Cron)

1. **Verificar Backpressure**
   ```bash
   .\scripts\check-backpressure.ps1 -Json
   ```

2. **Identificar Oportunidade**
   - Código: Refactor, otimização, bugfixes
   - Documentação: README, comentários, memória
   - Configuração: Ajustes em workflows
   - Skills: Novas capabilities

3. **Implementar**
   ```bash
   # Se GREEN (≤5 PRs)
   git checkout -b feature/melhoria-XX
   # ... implementa ...
   git commit -m "[kaixa-auto] Descrição"
   git push origin feature/melhoria-XX
   # Criar PR via gh

   # Se RED (≥9 PRs)
   # Melhoria local em docs/scripts
   ```

4. **Registrar**
   - Atualizar `memory/improvements/TRACKING.md`
   - Criar `memory/improvements/YYYY-MM-DD-*.md`

---

## 🛡️ Sistema de Backpressure

| Status | PRs Abertos | Ação | Prioridade |
|--------|-------------|------|------------|
| 🟢 **GREEN** | ≤5 | Criar PR normalmente | Qualquer melhoria |
| 🟡 **YELLOW** | 6-8 | Apenas melhorias críticas | Bugs, segurança |
| 🔴 **RED** | ≥9 | Melhoria local/documentação | Docs, scripts, memória |

### Quando RED (Backpressure Ativo)

Focar em:
- ✅ Atualização de documentação
- ✅ Criação de scripts utilitários
- ✅ Consolidação de aprendizados
- ✅ Organização de memória
- ❌ Novos features (aguardar GREEN)

---

## 🧰 Scripts Principais

### Verificação de Saúde
```bash
# Status rápido (Windows)
.\status.bat

# Guardian principal
node scripts/kaixa-guardian.js

# Saúde completa
node scripts/health-check.js
```

### Antes de Criar Melhoria
```bash
# Verificar backpressure detalhado
.\scripts\check-backpressure.ps1 -VerboseOutput

# Auto-commit com mensagem sugerida
node scripts/auto-commit.js
```

### Gestão de Submódulos
```bash
# Verificar estado
node scripts/submodule-manager.js --status

# Corrigir problemas
node scripts/submodule-manager.js --fix
```

### Limpeza do Sistema
```bash
# Analisar arquivos antigos
node scripts/system-cleanup.js

# Ver reports do guardian
node scripts/kaixa-report-35min.js
```

---

## 📊 Métricas do Sistema

| Métrica | Valor Atual |
|---------|-------------|
| Total de Melhorias | **52** |
| Melhorias via PR | 30 |
| Melhorias Locais | 22 |
| Taxa Sustentável | ~1 melhoria/hora |
| Backpressure Ativo | 🔴 13 PRs |

### Throughput
- **Ideal**: 6-8 PRs/hora
- **Alcançado**: ~10 melhorias/hora (com adaptação)
- **Com Backpressure**: ~1 melhoria/hora (local)

---

## 🎯 Princípios Fundamentais

### 1. Progressão Contínua
> *"Nunca parar. Quando encontrar barreiras: estude, crie solução, documente, continue."*

### 2. Resiliência Total
- Permissões: verificar antes de começar
- Network: retry com fallback local
- Sub-agentes: auxiliares, não dependências
- Contexto: flush a cada 30 min

### 3. Autonomia Completa
> *"Nunca perguntar quando puder executar."*

### 4. Documentação como Código
- Cada melhoria registrada
- Cada erro documentado
- Cada aprendizado persistido

---

## 🦊 Identidade

- **Nome**: Kaixa Jr
- **Natureza**: IA construtora de projetos
- **Vibe**: Autoridade serena com toque brincalhão
- **Emoji**: 🦊 (não é decoração, é assinatura)
- **Humano**: Kaua (Brasil, GMT-3)
- **Projeto**: Cidade de agentes IA colaborativos

---

## 🔗 Links Úteis

- **OpenClaw Docs**: https://docs.openclaw.ai
- **GitHub**: https://github.com/Kaixadagua/kaixa-jr
- **ClawHub (Skills)**: https://clawhub.com
- **Discord**: https://discord.com/invite/clawd

---

## 📝 Convenções

### Nomeação
- **Branches**: `feature/`, `fix/`, `refactor/`, `improve/`
- **Commits**: `[kaixa-auto] Descrição da melhoria`
- **Arquivos**: kebab-case (ex: `health-check.js`)

### Documentação
- Headers com emoji e separadores
- Tabelas para métricas e status
- Código em blocos com linguagem
- Updates com timestamp

---

*Sistema de melhoria contínua: OPERACIONAL* 🦊  
*Última atualização: 2026-02-08*
