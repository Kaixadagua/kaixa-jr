
/**
 * Validação de entrada adicionada em 2026-02-11T01:09:54.081Z
 * @param {any} input - Valor a validar
 * @param {string} type - Tipo esperado
 * @returns {boolean}
 */
function validateInput(input, type) {
  if (input === null || input === undefined) return false;
  
  const validators = {
    string: v => typeof v === 'string' && v.length > 0,
    number: v => typeof v === 'number' && !isNaN(v),
    array: v => Array.isArray(v) && v.length > 0,
    object: v => typeof v === 'object' && v !== null && !Array.isArray(v)
  };
  
  return validators[type] ? validators[type](input) : false;
}

module.exports = { validateInput };
