/**
 * @fileoverview Testes para CacheManager
 * @module tests/cacheManager.test
 */

const CacheManager = require('../scripts/lib/cacheManager');
const assert = require('assert');

// Reset antes dos testes
CacheManager.clear();

console.log('🧪 Testando CacheManager...\n');

// Test 1: Set e Get básico
console.log('Test 1: Set e Get básico');
CacheManager.set('key1', 'value1');
assert.strictEqual(CacheManager.get('key1'), 'value1');
console.log('✅ Passou\n');

// Test 2: Expiração
console.log('Test 2: Expiração (TTL=50ms)');
CacheManager.set('key2', 'value2', 50);
assert.strictEqual(CacheManager.get('key2'), 'value2');
setTimeout(() => {
  assert.strictEqual(CacheManager.get('key2'), undefined);
  console.log('✅ Passou\n');
  
  // Test 3: Has
  console.log('Test 3: Has');
  CacheManager.set('key3', 'value3', 1000);
  assert.strictEqual(CacheManager.has('key3'), true);
  console.log('✅ Passou\n');
  
  // Test 4: Delete
  console.log('Test 4: Delete');
  CacheManager.delete('key3');
  assert.strictEqual(CacheManager.has('key3'), false);
  console.log('✅ Passou\n');
  
  // Test 5: Estatísticas
  console.log('Test 5: Estatísticas');
  const stats = CacheManager.getStats();
  assert(stats.size >= 0);
  assert(typeof stats.hitRate === 'number');
  console.log('📊 Stats:', stats);
  console.log('✅ Passou\n');
  
  // Test 6: Memoize
  console.log('Test 6: Memoize');
  let callCount = 0;
  const expensiveFn = (x) => {
    callCount++;
    return x * 2;
  };
  const memoized = CacheManager.memoize(expensiveFn, 1000);
  
  assert.strictEqual(memoized(5), 10);
  assert.strictEqual(memoized(5), 10); // Deve usar cache
  assert.strictEqual(callCount, 1); // Chamada apenas uma vez
  console.log('✅ Passou\n');
  
  // Test 7: GetOrSet
  console.log('Test 7: GetOrSet (lazy loading)');
  let factoryCalls = 0;
  const factory = () => {
    factoryCalls++;
    return { data: 'expensive' };
  };
  
  const val1 = CacheManager.getOrSet('lazy1', factory, 1000);
  const val2 = CacheManager.getOrSet('lazy1', factory, 1000);
  
  assert.deepStrictEqual(val1, val2);
  assert.strictEqual(factoryCalls, 1);
  console.log('✅ Passou\n');
  
  console.log('🎉 Todos os testes passaram!');
  console.log('📊 Stats finais:', CacheManager.getStats());
}, 100);
