#!/usr/bin/env node
/**
 * quick-improve.js - Gerador rápido de melhorias locais
 * 
 * Uso: node scripts/quick-improve.js [categoria] [descricao]
 * Ex: node scripts/quick-improve.js docs "Adicionar índice no README"
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  'docs': { emoji: '📝', label: 'Documentação' },
  'code': { emoji: '💻', label: 'Código' },
  'config': { emoji: '⚙️', label: 'Configuração' },
  'workflow': { emoji: '🔄', label: 'Workflow' },
  'skill': { emoji: '🎓', label: 'Skill' },
  'test': { emoji: '🧪', label: 'Testes' },
  'fix': { emoji: '🐛', label: 'Bugfix' }
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, '').slice(0, 15);
}

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

function generateTemplate(category, description) {
  const cat = CATEGORIES[category] || CATEGORIES['docs'];
  const now = new Date().toISOString();
  
  return `# ${cat.emoji} Melhoria: ${description}

**Categoria:** ${cat.label}  
**Data:** ${now}  
**Tipo:** 📍 Local (backpressure ativo)

## 📋 Descrição

${description}

## 🎯 Motivação

- Melhoria contínua do sistema Kaixa Jr
- Contribuição para a base de conhecimento acumulada

## ✅ Alterações

- [ ] Implementação realizada
- [ ] Testado localmente
- [ ] Documentado

## 📝 Notas

Gerado automaticamente via \`quick-improve.js\`

---
*Melhoria #${Math.floor(Date.now() / 1000) % 10000} - Kaixa Jr 🦊*
`;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🦊 Quick Improve - Gerador de melhorias Kaixa Jr

Uso: node scripts/quick-improve.js [categoria] ["descrição"]

Categorias:
${Object.entries(CATEGORIES).map(([k, v]) => `  ${k.padEnd(8)} ${v.emoji} ${v.label}`).join('\n')}

Exemplos:
  node scripts/quick-improve.js docs "Atualizar README"
  node scripts/quick-improve.js code "Refatorar utils.js"
  node scripts/quick-improve.js fix "Corrigir timeout"
`);
    process.exit(0);
  }
  
  const category = args[0].toLowerCase();
  const description = args.slice(1).join(' ') || 'Melhoria incremental';
  
  if (!CATEGORIES[category]) {
    console.error(`❌ Categoria inválida: ${category}`);
    console.error(`Use: ${Object.keys(CATEGORIES).join(', ')}`);
    process.exit(1);
  }
  
  const dateStr = getDateString();
  const timestamp = getTimestamp();
  const filename = `${dateStr}-${timestamp}-${category}.md`;
  const filepath = path.join('memory', 'improvements', filename);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = generateTemplate(category, description);
  fs.writeFileSync(filepath, content, 'utf8');
  
  console.log(`✅ Melhoria criada: ${filepath}`);
  console.log(`   ${CATEGORIES[category].emoji} ${description}`);
  
  // Update tracking if exists
  const trackingPath = path.join('memory', 'improvements', 'TRACKING.md');
  if (fs.existsSync(trackingPath)) {
    console.log(`\n💡 Não esqueça de atualizar ${trackingPath}`);
  }
}

main();
