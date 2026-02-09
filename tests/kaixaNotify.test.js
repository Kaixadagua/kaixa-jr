#!/usr/bin/env node
/**
 * @fileoverview Testes para Kaixa Notify
 * 
 * @module tests/kaixaNotify.test
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const kaixaNotify = require('../scripts/lib/kaixaNotify');

// Mock console.log para capturar output
let consoleOutput = [];
const originalLog = console.log;
console.log = (...args) => {
  consoleOutput.push(args.join(' '));
};

/**
 * Test runner simples
 */
function describe(name, fn) {
  consoleOutput = [];
  console.log(`\n📦 ${name}`);
  try {
    fn();
    console.log(`✅ ${name} passou`);
  } catch (e) {
    console.log(`❌ ${name} falhou: ${e.message}`);
    throw e;
  }
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    throw e;
  }
}

// ============================================
// TESTES
// ============================================

describe('SEVERITY Constants', () => {
  it('should have all severity levels', () => {
    assert.strictEqual(kaixaNotify.SEVERITY.INFO, 'info');
    assert.strictEqual(kaixaNotify.SEVERITY.WARNING, 'warning');
    assert.strictEqual(kaixaNotify.SEVERITY.ERROR, 'error');
    assert.strictEqual(kaixaNotify.SEVERITY.CRITICAL, 'critical');
  });
});

describe('notify()', () => {
  it('should create notification with default level', () => {
    const notif = kaixaNotify.notify('Test message');
    assert.strictEqual(notif.message, 'Test message');
    assert.strictEqual(notif.level, 'info');
    assert.ok(notif.id.startsWith('notif_'));
    assert.ok(notif.timestamp);
  });

  it('should create notification with custom level', () => {
    const notif = kaixaNotify.notify('Warning message', { level: 'warning' });
    assert.strictEqual(notif.level, 'warning');
  });

  it('should include metadata', () => {
    const meta = { test: true, value: 123 };
    const notif = kaixaNotify.notify('With meta', { meta });
    assert.deepStrictEqual(notif.meta, meta);
  });

  it('should include source', () => {
    const notif = kaixaNotify.notify('From test', { source: 'test-suite' });
    assert.strictEqual(notif.source, 'test-suite');
  });
});

describe('Convenience methods', () => {
  it('info() should create info notification', () => {
    const notif = kaixaNotify.info('Info test');
    assert.strictEqual(notif.level, 'info');
  });

  it('warning() should create warning notification', () => {
    const notif = kaixaNotify.warning('Warning test');
    assert.strictEqual(notif.level, 'warning');
  });

  it('error() should create error notification', () => {
    const notif = kaixaNotify.error('Error test');
    assert.strictEqual(notif.level, 'error');
  });

  it('critical() should create critical notification', () => {
    const notif = kaixaNotify.critical('Critical test');
    assert.strictEqual(notif.level, 'critical');
  });
});

describe('getHistory()', () => {
  it('should return empty array when no history', () => {
    // Backup e limpa
    const historyFile = path.join(process.cwd(), 'memory/notifications/history.jsonl');
    let backup = null;
    if (fs.existsSync(historyFile)) {
      backup = fs.readFileSync(historyFile, 'utf8');
      fs.unlinkSync(historyFile);
    }

    const history = kaixaNotify.getHistory();
    assert.ok(Array.isArray(history));
    assert.strictEqual(history.length, 0);

    // Restaura
    if (backup) {
      fs.writeFileSync(historyFile, backup);
    }
  });

  it('should respect limit parameter', () => {
    // Cria notificações de teste
    for (let i = 0; i < 5; i++) {
      kaixaNotify.notify(`Test ${i}`);
    }

    const history = kaixaNotify.getHistory(3);
    assert.ok(history.length <= 3);
  });
});

describe('exportReport()', () => {
  it('should generate markdown report', () => {
    const report = kaixaNotify.exportReport({ format: 'markdown', hours: 1 });
    assert.ok(report.includes('# 📊 Relatório de Notificações'));
    assert.ok(report.includes('**Período:**'));
  });

  it('should generate JSON report', () => {
    const report = kaixaNotify.exportReport({ format: 'json', hours: 1 });
    const parsed = JSON.parse(report);
    assert.ok(Array.isArray(parsed));
  });
});

describe('Integration', () => {
  it('should persist notifications to file', () => {
    const before = kaixaNotify.getHistory(1000).length;
    kaixaNotify.notify('Persistence test', { level: 'info' });
    const after = kaixaNotify.getHistory(1000).length;
    assert.strictEqual(after, before + 1);
  });

  it('should create notification directory', () => {
    const notifDir = path.join(process.cwd(), 'memory/notifications');
    assert.ok(fs.existsSync(notifDir), 'Diretório de notificações deve existir');
  });
});

// ============================================
// RUN
// ============================================

console.log('\n🦊 Kaixa Notify - Test Suite\n');

try {
  // Executa todos os testes
  const tests = [
    'SEVERITY Constants',
    'notify()',
    'Convenience methods',
    'getHistory()',
    'exportReport()',
    'Integration'
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(testName => {
    consoleOutput = [];
    try {
      // Re-executa o describe para cada teste
      switch (testName) {
        case 'SEVERITY Constants':
          describe('SEVERITY Constants', () => {
            it('should have all severity levels', () => {
              assert.strictEqual(kaixaNotify.SEVERITY.INFO, 'info');
              assert.strictEqual(kaixaNotify.SEVERITY.WARNING, 'warning');
              assert.strictEqual(kaixaNotify.SEVERITY.ERROR, 'error');
              assert.strictEqual(kaixaNotify.SEVERITY.CRITICAL, 'critical');
            });
          });
          break;
        case 'notify()':
          describe('notify()', () => {
            it('should create notification with default level', () => {
              const notif = kaixaNotify.notify('Test message');
              assert.strictEqual(notif.message, 'Test message');
              assert.strictEqual(notif.level, 'info');
            });
            it('should create notification with custom level', () => {
              const notif = kaixaNotify.notify('Warning message', { level: 'warning' });
              assert.strictEqual(notif.level, 'warning');
            });
          });
          break;
        case 'Convenience methods':
          describe('Convenience methods', () => {
            it('info() should create info notification', () => {
              const notif = kaixaNotify.info('Info test');
              assert.strictEqual(notif.level, 'info');
            });
            it('warning() should create warning notification', () => {
              const notif = kaixaNotify.warning('Warning test');
              assert.strictEqual(notif.level, 'warning');
            });
          });
          break;
        case 'getHistory()':
          describe('getHistory()', () => {
            it('should return array', () => {
              const history = kaixaNotify.getHistory();
              assert.ok(Array.isArray(history));
            });
          });
          break;
        case 'exportReport()':
          describe('exportReport()', () => {
            it('should generate markdown report', () => {
              const report = kaixaNotify.exportReport({ format: 'markdown', hours: 1 });
              assert.ok(typeof report === 'string');
            });
          });
          break;
        case 'Integration':
          describe('Integration', () => {
            it('should work end-to-end', () => {
              const notif = kaixaNotify.notify('E2E test');
              assert.ok(notif.id);
              assert.ok(notif.timestamp);
            });
          });
          break;
      }
      passed++;
    } catch (e) {
      failed++;
      console.log(`  ❌ ${testName} failed: ${e.message}`);
    }
  });

  console.log = originalLog;
  console.log(`\n📊 Resultados: ${passed} passaram, ${failed} falharam\n`);

  process.exit(failed > 0 ? 1 : 0);

} catch (e) {
  console.log = originalLog;
  console.error('\n❌ Test suite falhou:', e.message);
  console.error(e.stack);
  process.exit(1);
}
