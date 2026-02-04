/**
 * Tests for Auto Commit system
 * 
 * @module tests/systems/autoCommit.test
 */

const { autoCommit, getStatus, suggestMessage, checkBackpressure } = require('../../src/systems/autoCommit');

describe('AutoCommit', () => {
  describe('getStatus', () => {
    it('should return status object', () => {
      const status = getStatus();
      expect(status).toHaveProperty('hasChanges');
      expect(status).toHaveProperty('files');
      expect(Array.isArray(status.files)).toBe(true);
    });
  });
  
  describe('suggestMessage', () => {
    it('should suggest message for new files', () => {
      const files = [{ status: 'A', file: 'test.js' }];
      const message = suggestMessage(files);
      expect(message).toContain('add:');
    });
    
    it('should suggest message for modified files', () => {
      const files = [{ status: 'M', file: 'test.js' }];
      const message = suggestMessage(files);
      expect(message).toContain('update:');
    });
    
    it('should suggest message for deleted files', () => {
      const files = [{ status: 'D', file: 'test.js' }];
      const message = suggestMessage(files);
      expect(message).toContain('remove:');
    });
    
    it('should suggest combined message for mixed changes', () => {
      const files = [
        { status: 'A', file: 'new.js' },
        { status: 'M', file: 'mod.js' }
      ];
      const message = suggestMessage(files);
      expect(message).toMatch(/\[kaixa-\d{8}\]/);
    });
  });
  
  describe('checkBackpressure', () => {
    it('should return backpressure status', () => {
      const bp = checkBackpressure();
      expect(bp).toHaveProperty('canProceed');
      expect(typeof bp.canProceed).toBe('boolean');
    });
  });
  
  describe('autoCommit', () => {
    it('should handle no changes', () => {
      const result = autoCommit({ dryRun: true });
      expect(result).toHaveProperty('committed');
    });
  });
});
