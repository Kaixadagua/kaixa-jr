/**
 * @fileoverview Cache Manager with TTL - Sistema de cache com expiração
 * @module utils/cacheManager
 * 
 * Cache em memória com TTL (Time-To-Live) para otimizar operações repetidas.
 * Útil para cachear resultados de comandos git, métricas e dados computacionalmente caros.
 * 
 * @example
 * const cache = require('./cacheManager');
 * 
 * // Cache por 5 minutos
 * cache.set('git-status', statusData, 5 * 60 * 1000);
 * 
 * // Recupera se válido
 * const cached = cache.get('git-status');
 * if (cached) return cached;
 * 
 * @author Kaixa Jr
 * @since 2026-02-09
 */

/**
 * Entrada do cache
 * @typedef {Object} CacheEntry
 * @property {*} value - Valor armazenado
 * @property {number} expiresAt - Timestamp de expiração
 * @property {number} createdAt - Timestamp de criação
 * @property {number} hits - Número de acertos
 */

/**
 * Estatísticas do cache
 * @typedef {Object} CacheStats
 * @property {number} size - Número de entradas
 * @property {number} hits - Total de acertos
 * @property {number} misses - Total de misses
 * @property {number} evictions - Total de evicções
 * @property {number} hitRate - Taxa de acerto (%)
 */

/**
 * Manager de cache com TTL
 * @namespace CacheManager
 */
const CacheManager = {
  /** @type {Map<string, CacheEntry>} */
  _cache: new Map(),
  
  /** @type {number} */
  _hits: 0,
  
  /** @type {number} */
  _misses: 0,
  
  /** @type {number} */
  _evictions: 0,

  /**
   * TTL padrão em ms (5 minutos)
   * @constant {number}
   */
  DEFAULT_TTL: 5 * 60 * 1000,

  /**
   * Max entradas antes de cleanup automático
   * @constant {number}
   */
  MAX_ENTRIES: 100,

  /**
   * Armazena valor no cache
   * @param {string} key - Chave de identificação
   * @param {*} value - Valor a armazenar
   * @param {number} [ttlMs] - TTL em ms (padrão: 5 min)
   * @returns {CacheEntry} Entrada criada
   */
  set(key, value, ttlMs = CacheManager.DEFAULT_TTL) {
    const now = Date.now();
    const entry = {
      value,
      expiresAt: now + ttlMs,
      createdAt: now,
      hits: 0
    };
    
    CacheManager._cache.set(key, entry);
    
    // Cleanup se necessário
    if (CacheManager._cache.size > CacheManager.MAX_ENTRIES) {
      CacheManager._cleanup();
    }
    
    return entry;
  },

  /**
   * Recupera valor do cache
   * @param {string} key - Chave de identificação
   * @returns {*} Valor ou undefined se não existe/expirado
   */
  get(key) {
    const entry = CacheManager._cache.get(key);
    
    if (!entry) {
      CacheManager._misses++;
      return undefined;
    }
    
    // Verifica expiração
    if (Date.now() > entry.expiresAt) {
      CacheManager._cache.delete(key);
      CacheManager._evictions++;
      CacheManager._misses++;
      return undefined;
    }
    
    entry.hits++;
    CacheManager._hits++;
    return entry.value;
  },

  /**
   * Verifica se chave existe e não expirou
   * @param {string} key - Chave de identificação
   * @returns {boolean}
   */
  has(key) {
    const entry = CacheManager._cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      CacheManager._cache.delete(key);
      CacheManager._evictions++;
      return false;
    }
    
    return true;
  },

  /**
   * Remove entrada do cache
   * @param {string} key - Chave de identificação
   * @returns {boolean} True se removido
   */
  delete(key) {
    return CacheManager._cache.delete(key);
  },

  /**
   * Limpa todo o cache
   */
  clear() {
    CacheManager._cache.clear();
    CacheManager._hits = 0;
    CacheManager._misses = 0;
    CacheManager._evictions = 0;
  },

  /**
   * Remove entradas expiradas
   * @returns {number} Número de entradas removidas
   */
  cleanup() {
    return CacheManager._cleanup();
  },

  /**
   * @private
   * @returns {number}
   */
  _cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of CacheManager._cache) {
      if (now > entry.expiresAt) {
        CacheManager._cache.delete(key);
        CacheManager._evictions++;
        removed++;
      }
    }
    
    // Se ainda estiver cheio, remove os mais antigos
    if (CacheManager._cache.size > CacheManager.MAX_ENTRIES) {
      const entries = Array.from(CacheManager._cache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const toRemove = CacheManager._cache.size - CacheManager.MAX_ENTRIES;
      for (let i = 0; i < toRemove; i++) {
        CacheManager._cache.delete(entries[i][0]);
        CacheManager._evictions++;
        removed++;
      }
    }
    
    return removed;
  },

  /**
   * Retorna estatísticas do cache
   * @returns {CacheStats}
   */
  getStats() {
    const total = CacheManager._hits + CacheManager._misses;
    return {
      size: CacheManager._cache.size,
      hits: CacheManager._hits,
      misses: CacheManager._misses,
      evictions: CacheManager._evictions,
      hitRate: total > 0 ? Math.round((CacheManager._hits / total) * 100) : 0
    };
  },

  /**
   * Retorna todas as chaves válidas
   * @returns {string[]}
   */
  keys() {
    CacheManager._cleanup();
    return Array.from(CacheManager._cache.keys());
  },

  /**
   * Memoiza função com cache automático
   * @template T
   * @param {function(...*): T} fn - Função a memoizar
   * @param {number} [ttlMs] - TTL em ms
   * @param {function(*): string} [keyFn] - Função para gerar chave
   * @returns {function(...*): T} Função memoizada
   */
  memoize(fn, ttlMs = CacheManager.DEFAULT_TTL, keyFn = JSON.stringify) {
    return function(...args) {
      const key = `${fn.name}:${keyFn(args)}`;
      const cached = CacheManager.get(key);
      
      if (cached !== undefined) {
        return cached;
      }
      
      const result = fn.apply(this, args);
      CacheManager.set(key, result, ttlMs);
      return result;
    };
  },

  /**
   * Cache com getter lazy (carrega sob demanda)
   * @template T
   * @param {string} key - Chave de identificação
   * @param {function(): T} factory - Função para criar valor
   * @param {number} [ttlMs] - TTL em ms
   * @returns {T} Valor (do cache ou factory)
   */
  getOrSet(key, factory, ttlMs = CacheManager.DEFAULT_TTL) {
    const cached = CacheManager.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const value = factory();
    CacheManager.set(key, value, ttlMs);
    return value;
  }
};

module.exports = CacheManager;
