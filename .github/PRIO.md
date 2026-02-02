# Backlog de PRs - Priorização

## Status: 10 PRs Abertos
**Data:** 2026-02-02 01:08  
**Bloqueio:** Aguardando revisão do JUP

## Ordem de Merge Recomendada

### Wave 1: Infraestrutura (Sem dependências)
1. **#9** - chore(git): .gitignore padrão
2. **#10** - docs(github): template de PR

### Wave 2: Testes e Qualidade
3. **#7** - test(utils): testes unitários
4. **#8** - chore(package): scripts de teste npm
5. **#5** - refactor(utils): remove clamp duplicada

### Wave 3: Funcionalidades Core
6. **#1** - fix(memory): resolve memory leaks
7. **#4** - feat(a11y): atributos ARIA
8. **#6** - feat(error): error handling global

### Wave 4: Documentação
9. **#3** - docs(js): JSDoc completo (preferido)
10. **#2** - docs(app): JSDoc funções (superseded by #3)

## Decisões
- **#2 vs #3:** Merge apenas #3 (mais completo), fechar #2
- **Após Wave 4:** Considerar bot de auto-merge para testes passando

## Comandos para Revisão em Batch
```bash
# Revisar todos
git fetch origin
git checkout master

# Wave 1
gh pr merge 9 --auto
git pull origin master
gh pr merge 10 --auto
git pull origin master

# Wave 2
git checkout -b wave2
git merge origin/improve/add-unit-tests
git merge origin/improve/add-npm-scripts
git merge origin/refactor/remove-duplicate-clamp
git push origin wave2
```

## Próxima Ação
Aguardando JUP ou configuração de auto-merge.

---
*Atualizado: 2026-02-02 01:08*
