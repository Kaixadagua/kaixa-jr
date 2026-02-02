# Checklist de Revisão para JUP

## PRs Pendentes - Ordem de Prioridade

### 1. fix(memory): resolve memory leaks (#1)
- [ ] Verificar se cleanupGameIntervals() funciona corretamente
- [ ] Testar reinício do game loop
- [ ] Aprovar se não houver regressão

### 2. docs(app): adiciona JSDoc (#2)
- [ ] Verificar consistência com #3 (overlap)
- [ ] Decidir: merge #2 ou #3 (ou ambos)

### 3. docs(js): JSDoc completo (#3)
- [ ] Verificar se cobre mais funções que #2
- [ ] Aprovar se for mais completo

### 4. feat(a11y): atributos ARIA (#4)
- [ ] Verificar se labels são adequadas
- [ ] Testar navegação por teclado
- [ ] Aprovar se acessibilidade melhorou

### 5. refactor(utils): remove clamp duplicada (#5)
- [ ] Verificar se não quebra funcionalidade
- [ ] Aprovar se testes passarem

### 6. feat(error): error handling global (#6)
- [ ] Verificar se handleError() captura exceções
- [ ] Testar com erro proposital
- [ ] Aprovar se não houver regressão

### 7. test(utils): testes unitários (#7)
- [ ] Rodar `node js/utils.test.js`
- [ ] Verificar se todos passam
- [ ] Aprovar se cobertura estiver OK

### 8. chore(package): scripts de teste npm (#8)
- [ ] Verificar `npm test` funciona
- [ ] Aprovar se integração estiver OK

### 9. chore(git): .gitignore padrão (#9)
- [ ] Verificar se ignora arquivos corretos
- [ ] Aprovar se padrão estiver OK

## Decisões Pendentes
1. **#2 vs #3:** Qual JSDoc manter? (sugestão: #3 é mais completo)
2. **Ordem de merge:** Sugestão: #9 → #5 → #7 → #8 → #1 → #4 → #6 → #3

## Comandos Úteis
```bash
# Revisar PR específico
gh pr checkout <numero>

# Rodar testes
npm test

# Verificar diff
gh pr diff <numero>
```

---
*Documento criado para facilitar revisão do JUP*
