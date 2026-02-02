# Configuração de Workflow - AgentCorp

## Mudanças Aplicadas (2026-02-02 16:43)

### 1. Cron Atualizado
- **Antes:** 5 minutos
- **Depois:** 10 minutos ✅

### 2. Foco do Trabalho
- **Repositório:** AgentCorp (GitHub)
- **Branch principal:** dev-kaixa
- **Workflow:** Feature branches → dev-kaixa

### 3. Estratégia de Branches
```
main (protegida)
  ↑
dev-kaixa (integração Kaixa)
  ↑
feature/* (branches de trabalho)
```

### 4. Processo de Trabalho
1. Criar branch a partir de dev-kaixa: `git checkout -b feature/xyz`
2. Implementar melhoria
3. Commit e push
4. Merge para dev-kaixa
5. PR para main quando pronto

### 5. Configuração Git
```bash
# Configurar repositório remoto
git remote add origin https://github.com/AgentCorp/AgentCorp.git

# Criar branch dev-kaixa se não existir
git checkout -b dev-kaixa

# Workflow de feature branches
git checkout -b feature/nome-da-feature dev-kaixa
```

## Próximos Passos

1. Clonar repositório AgentCorp quando disponível
2. Criar branch dev-kaixa
3. Configurar remote tracking
4. Iniciar trabalho de programação

---
*Reconfiguração para AgentCorp 🦊*
