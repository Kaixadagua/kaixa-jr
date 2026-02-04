/**
 * Tests for Health Check system
 * 
 * @module tests/systems/healthCheck.test
 */

const { checkHealth, displayReport } = require('../../src/systems/healthCheck');

describe('HealthCheck', () => {
  describe('checkHealth', () => {
    it('should return health status object', () => {
      const results = checkHealth();
      
      expect(results).toHaveProperty('timestamp');
      expect(results).toHaveProperty('checks');
      expect(results).toHaveProperty('overall');
      expect(results).toHaveProperty('summary');
    });
    
    it('should check Node.js version', () => {
      const results = checkHealth();
      expect(results.checks).toHaveProperty('node');
      expect(results.checks.node).toHaveProperty('status');
      expect(results.checks.node).toHaveProperty('version');
    });
    
    it('should check Git availability', () => {
      const results = checkHealth();
      expect(results.checks).toHaveProperty('git');
      expect(['ok', 'error']).toContain(results.checks.git.status);
    });
    
    it('should check required directories', () => {
      const results = checkHealth();
      expect(results.checks).toHaveProperty('dir_src');
      expect(results.checks).toHaveProperty('dir_scripts');
      expect(results.checks).toHaveProperty('dir_memory');
      expect(results.checks).toHaveProperty('dir_tests');
    });
    
    it('should check .env file', () => {
      const results = checkHealth();
      expect(results.checks).toHaveProperty('env');
      expect(['ok', 'warning']).toContain(results.checks.env.status);
    });
    
    it('should calculate overall status', () => {
      const results = checkHealth();
      expect(['ok', 'warning', 'error']).toContain(results.overall);
    });
    
    it('should provide summary counts', () => {
      const results = checkHealth();
      expect(results.summary).toHaveProperty('total');
      expect(results.summary).toHaveProperty('ok');
      expect(results.summary).toHaveProperty('warning');
      expect(results.summary).toHaveProperty('error');
      expect(results.summary.ok + results.summary.warning + results.summary.error)
        .toBe(results.summary.total);
    });
  });
  
  describe('displayReport', () => {
    it('should not throw', () => {
      const results = checkHealth();
      expect(() => displayReport(results)).not.toThrow();
    });
  });
});
