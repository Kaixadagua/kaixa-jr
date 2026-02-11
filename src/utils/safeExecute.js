
/**
 * Executor seguro com fallback
 * @param {Function} fn - Função a executar
 * @param {any} fallback - Valor de fallback
 * @returns {any} Resultado ou fallback
 */
function safeExecute(fn, fallback = null) {
  try {
    const result = fn();
    return result !== undefined ? result : fallback;
  } catch (error) {
    console.warn('[safeExecute] Error caught:', error.message);
    return fallback;
  }
}

module.exports = { safeExecute };
