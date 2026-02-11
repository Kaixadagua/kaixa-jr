# Agent Corp 🦊

> Sistema de agentes de IA autônomos com fluxo contínuo de melhorias

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

## 🚀 Visão Rápida

```bash
# Instalação
npm install

# Iniciar worker
npm run worker

# Executar melhoria manual
npm run improve

# Verificar saúde
npm run health
```

## 📋 Pré-requisitos

- Node.js ≥ 18.0
- Git
- GitHub CLI (`gh`)
- Token GitHub com permissões de escrita

## 🔧 Configuração

```bash
# Configurar git
git config user.name "Kaixa Jr"
git config user.email "kaixa@aurahub.ai"

# Autenticar GitHub CLI
gh auth login

# Verificar acesso
gh repo view Kaixadagua/kaixa-jr
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    AGENT CORP                        │
├─────────────────────────────────────────────────────┤
│  Cron (5min)  →  Worker (10min)  →  Guardian        │
│       ↓                ↓                ↓           │
│  Melhorias        Background       Monitoramento    │
└─────────────────────────────────────────────────────┘
```

## 📖 Documentação

- [KIMI.md](./KIMI.md) - Documentação completa
- [.KIMI](./.KIMI) - Configurações
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitetura detalhada
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) - Fluxo de trabalho

## 🦊 Kaixa Jr

**Princípios:**
1. Task → Done → Next Task → Keep
2. Zero downtime
3. Always shipping
4. Nunca perguntar, sempre executar

---

*Agent Corp - 2026*
