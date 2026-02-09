#!/usr/bin/env node
/**
 * improvement-backup.js
 * Faz backup automático das melhorias mais recentes para arquivo consolidado
 * 
 * @usage node scripts/improvement-backup.js
 */

const fs = require('fs');
const path = require('path');

const IMPROVEMENTS_DIR = path.join(__dirname, '..', 'memory', 'improvements');
const BACKUP_FILE = path.join(IMPROVEMENTS_DIR, 'BACKUP-CONSOLIDADO.md');
const MAX_BACKUPS = 20; // Manter últimas 20 melhorias

function getImprovementFiles() {
  if (!fs.existsSync(IMPROVEMENTS_DIR)) {
    return [];
  }
  
  return fs.readdirSync(IMPROVEMENTS_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}T.*-melhoria\.md$/))
    .map(f => ({
      name: f,
      path: path.join(IMPROVEMENTS_DIR, f),
      mtime: fs.statSync(path.join(IMPROVEMENTS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, MAX_BACKUPS);
}

function readImprovement(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function generateBackup() {
  const files = getImprovementFiles();
  
  if (files.length === 0) {
    console.log('🦊 Nenhuma melhoria encontrada para backup');
    return;
  }

  const timestamp = new Date().toISOString();
  let content = `# Backup Consolidado de Melhorias

> Gerado automaticamente em: ${timestamp}
> Total de melhorias: ${files.length}

---

`;

  for (const file of files) {
    const improvement = readImprovement(file.path);
    if (improvement) {
      content += `<!-- MELHORIA: ${file.name} -->\n\n`;
      content += improvement;
      content += '\n\n---\n\n';
    }
  }

  fs.writeFileSync(BACKUP_FILE, content, 'utf-8');
  console.log(`✅ Backup criado: ${BACKUP_FILE}`);
  console.log(`📊 Melhorias incluídas: ${files.length}`);
}

// Execução
if (require.main === module) {
  generateBackup();
}

module.exports = { generateBackup, getImprovementFiles };
