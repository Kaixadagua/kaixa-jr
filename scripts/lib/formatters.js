/**
 * String Utilities - Formatters
 * @module utils/formatters
 */

/**
 * Formata bytes para representação legível
 * @param {number} bytes - Tamanho em bytes
 * @param {number} [decimals=2] - Casas decimais
 * @returns {string} Formatação legível (ex: "1.5 MB")
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536000) // "1.46 MB"
 * formatBytes(0) // "0 B"
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  if (!bytes || bytes < 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const index = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, index)).toFixed(decimals));
  
  return `${value} ${sizes[index]}`;
}

/**
 * Formata duração em milissegundos para string legível
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Formatação legível (ex: "2h 30m")
 * @example
 * formatDuration(3600000) // "1h"
 * formatDuration(90000) // "1m 30s"
 * formatDuration(5000) // "5s"
 */
function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Trunca texto com ellipsis
 * @param {string} text - Texto original
 * @param {number} [maxLength=50] - Comprimento máximo
 * @returns {string} Texto truncado
 * @example
 * truncate("hello world", 8) // "hello..."
 */
function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

module.exports = {
  formatBytes,
  formatDuration,
  truncate
};
