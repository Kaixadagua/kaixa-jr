const { validateInput } = require('../../src/utils/validation');

describe('Validation', () => {
  describe('Edge Cases', () => {
    it('should handle null input', () => {
      expect(validateInput(null, 'string')).toBe(false);
    });
    
    it('should handle undefined input', () => {
      expect(validateInput(undefined, 'number')).toBe(false);
    });
    
    it('should handle empty string', () => {
      expect(validateInput('', 'string')).toBe(false);
    });
    
    it('should handle NaN', () => {
      expect(validateInput(NaN, 'number')).toBe(false);
    });
  });
});
